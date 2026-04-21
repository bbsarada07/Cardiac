import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import wfdb
from src.modules.cnn_morphology import ECGCNN

def generate_synthetic_morphologies(num_samples=1000, length=2000):
    """
    Generate synthetic ECG morphology data for training demonstration.
    In a full clinical pipeline, this would use labeled segments from MIT-BIH.
    """
    X = []
    y = []
    
    t = np.linspace(0, 10, length)
    
    for _ in range(num_samples):
        # 0: Normal
        # Simplified ECG model
        hr = np.random.uniform(60, 100)
        bps = hr / 60
        ecg = np.zeros(length)
        for i in range(int(10 * bps)):
            pos = i * (length // (10 * bps))
            if pos + 200 < length:
                ecg[int(pos):int(pos+200)] = np.sin(np.linspace(0, np.pi, 200)) # PWave
                ecg[int(pos)+80:int(pos)+100] = 5.0 # QRS
                ecg[int(pos)+140:int(pos)+180] = 0.5 * np.sin(np.linspace(0, np.pi, 40)) # TWave
        
        # Noise
        ecg += np.random.normal(0, 0.05, length)
        X.append(ecg)
        y.append(0)

        # 1: ST Elevation (Raise the segment after QRS)
        st_ecg = ecg.copy()
        for i in range(int(10 * bps)):
            pos = i * (length // (10 * bps))
            if int(pos)+100 < length and int(pos)+140 < length:
                st_ecg[int(pos)+100:int(pos)+140] += 0.8
        X.append(st_ecg)
        y.append(1)

        # 2: PVC (Ectopic beat - wide QRS, no P wave)
        pvc_ecg = ecg.copy()
        pvc_pos = np.random.randint(200, length - 400)
        pvc_ecg[pvc_pos:pvc_pos+150] = -4.0 * np.sin(np.linspace(0, np.pi, 150)) # Wide QRS
        X.append(pvc_ecg)
        y.append(4)

    X = np.array(X).reshape(-1, 1, length)
    y = np.array(y)
    
    return torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.long)

def train_model():
    print("[CNN TRAIN] Preparing training data...")
    X, y = generate_synthetic_morphologies()
    
    dataset = torch.utils.data.TensorDataset(X, y)
    train_loader = torch.utils.data.DataLoader(dataset, batch_size=32, shuffle=True)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = ECGCNN(num_classes=5).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print(f"[CNN TRAIN] Training on {device}...")
    epochs = 5
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for batch_X, batch_y in train_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(train_loader):.4f}")

    torch.save(model.state_dict(), "cnn_weights.pth")
    print("[CNN TRAIN] Training complete. Saved weights to cnn_weights.pth")

if __name__ == "__main__":
    train_model()
