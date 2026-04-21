import torch
import torch.nn as nn
import numpy as np
import os

class ECGCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(ECGCNN, self).__init__()
        # Input: (Batch, 1, 2000)
        self.features = nn.Sequential(
            nn.Conv1d(1, 16, kernel_size=15, stride=2, padding=7),
            nn.BatchNorm1d(16),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),
            
            nn.Conv1d(16, 32, kernel_size=11, stride=2, padding=5),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),
            
            nn.Conv1d(32, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.MaxPool1d(kernel_size=2),
        )
        
        # Calculate flattened size: 
        # 2000 -> (Conv1/Pool1) -> 500 -> (Conv2/Pool2) -> 125 -> (Conv3/Pool3) -> 31
        # 64 * 31 = 1984
        self.classifier = nn.Sequential(
            nn.Linear(64 * 31, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

class ECGMorphologyCNN:
    """
    Upgrade 3: 1D CNN for real-time ECG morphology recognition.
    Identifies dangerous patterns like ST elevation and PVCs.
    """
    def __init__(self, weights_path="cnn_weights.pth"):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = ECGCNN(num_classes=5).to(self.device)
        self.is_loaded = False
        
        if os.path.exists(weights_path):
            try:
                self.model.load_state_dict(torch.load(weights_path, map_location=self.device))
                self.is_loaded = True
                print(f"[CNN MODULE] Weights loaded from {weights_path}")
            except Exception as e:
                print(f"[CNN MODULE] Failed to load weights: {e}")
        
        self.model.eval()
        self.classes = ["Normal", "ST Elevation", "T-Wave Inversion", "QRS Widening", "PVC Detected"]
        self.last_detection = "Normal"
        self.last_confidence = 0.0

    def detect(self, waveform_window):
        """
        Takes a 10-second ECG window (2000 points).
        Returns the classification label and confidence.
        """
        if len(waveform_window) < 2000:
            return "Warming up...", 0.0

        # Preprocess: Normalize to [-1, 1]
        data = np.array(waveform_window, dtype=np.float32)
        data = (data - np.mean(data)) / (np.std(data) + 1e-6)
        
        with torch.no_grad():
            input_tensor = torch.tensor(data).unsqueeze(0).unsqueeze(0).to(self.device)
            output = self.model(input_tensor)
            probs = torch.softmax(output, dim=1)
            conf, pred = torch.max(probs, 1)
            
            self.last_detection = self.classes[pred.item()]
            self.last_confidence = conf.item() * 100
            
            return self.last_detection, self.last_confidence
