import torch
import torch.nn as nn
import numpy as np

class CardiacLSTM(nn.Module):
    def __init__(self, input_size=3, hidden_size=32, num_layers=2):
        super(CardiacLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # Batch first means input should be (batch, seq_len, features)
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        
        # Output is a single predicted stability score
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        # x is (batch, seq_len, input_size)
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # out: tensor of shape (batch, seq_len, hidden_size)
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        return out

class LSTMPredictor:
    def __init__(self, model_path=None, sequence_length=60):
        self.sequence_length = sequence_length
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.model = CardiacLSTM(input_size=3, hidden_size=32, num_layers=2).to(self.device)
        self.is_loaded = False
        
        if model_path:
            try:
                self.model.load_state_dict(torch.load(model_path, map_location=self.device))
                self.is_loaded = True
            except Exception as e:
                print(f"Warning: Could not load LSTM model weights from {model_path}. Using untrained initialization. ({e})")
        
        self.model.eval()
        
        # Buffer to keep the last `sequence_length` points
        # Each point is [HR, SDNN, Stability]
        self.buffer = []
        
        # Track if we are in simulation mode (used for mock confidence variance)
        self.is_simulating = False
        self.last_prediction = 100.0
        
    def add_data(self, hr, sdnn, stability):
        self.buffer.append([float(hr), float(sdnn), float(stability)])
        if len(self.buffer) > self.sequence_length:
            self.buffer.pop(0)

    def predict_5_min_future(self, current_stability, is_simulating=False):
        """
        Runs inference on the current 60-second buffer to predict stability 5 minutes out.
        Returns: predicted_stability (float), confidence_percentage (float)
        """
        self.is_simulating = is_simulating
        
        if len(self.buffer) < self.sequence_length:
            return 0.0, 0.0 # Not enough data
            
        with torch.no_grad():
            seq_tensor = torch.tensor(self.buffer, dtype=torch.float32).unsqueeze(0).to(self.device)
            # Normalization approximation without external scaler for ease of integration
            # HR: ~50-150 -> / 150.0
            # SDNN: ~10-100 -> / 100.0
            # Stability: 0-100 -> / 100.0
            scaler = torch.tensor([150.0, 100.0, 100.0], dtype=torch.float32).to(self.device)
            seq_tensor = seq_tensor / scaler
            
            output = self.model(seq_tensor)
            
            # Re-scale output stability
            predicted_stability = output.item() * 100.0
            
            # Post-process for realistic bounds
            # If the model isn't pre-trained properly, it might spit out wild numbers.
            # In clinical simulation mode, we smoothly interpolate if untrained to avoid UI breakage.
            if self.is_simulating and not self.is_loaded:
                # Mock a decent prediction: tends downwards if current stability is dropping
                recent_trend = (self.buffer[-1][2] - self.buffer[0][2])
                predicted_stability = current_stability + recent_trend * 1.5 + np.random.uniform(-1, 1)
            else:
                 # Clamp to 0-100
                 predicted_stability = max(0.0, min(100.0, predicted_stability))
            
            self.last_prediction = predicted_stability
            
            # Confidence Calculation
            # Higher confidence if current state is stable, lower if highly unstable or fluctuating wildly
            recent_stabilities = [pt[2] for pt in self.buffer[-10:]]
            variance = np.var(recent_stabilities)
            # Heuristic: confidence drops as variance increases, maxes out at 95%
            confidence = max(40.0, 95.0 - (variance * 0.5)) 
            if confidence > 95.0: confidence = 95.0
            
            return predicted_stability, confidence
