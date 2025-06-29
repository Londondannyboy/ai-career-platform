# 🐛 Hume AI Integration Debug Guide

## Quick Debug Steps for Live Site

### 1. **Open Browser Console** 
Visit https://ai-career-platform.vercel.app/quest and open Developer Tools (F12)

### 2. **Check Environment Variables**
In console, look for these logs when you click "Start Quest":
```
🔑 Hume API Key status: Present (cL5dGCBT...)
⚙️ Hume Config ID status: Present (8f16326f-a45d-4433-9a12-890120244ec3)
🔗 Connecting to Hume AI EVI with Config ID: 8f16326f-a45d-4433-9a12-890120244ec3
```

❌ **If you see "Missing" instead of "Present"** → Environment variables not set in Vercel

### 3. **Check WebSocket Connection**
Look for:
```
✅ Connected to Hume AI EVI WebSocket with config: 8f16326f-a45d-4433-9a12-890120244ec3
```

❌ **If you see connection errors** → Check these issues:

#### A. **WebSocket URL Issues**
Expected URL format:
```
wss://api.hume.ai/v0/evi/chat?config_id=8f16326f-a45d-4433-9a12-890120244ec3&api_key=cL5dGCBT1EAaAau7eNA84WVfQ3QpS3t2WRZgZvhwYUWhgN0V
```

#### B. **API Key Issues**
- API key expired or invalid
- Billing/quota limits reached
- Wrong API key format

### 4. **Check Microphone Permissions**
Look for:
```
🎤 Microphone access granted
🎵 Started audio streaming to Hume AI
```

❌ **If microphone fails**:
- Browser blocked microphone access
- HTTPS required for microphone (Vercel should provide this)
- User denied permission

### 5. **Check Audio Processing**
Look for:
```
🎤 Audio data available, size: [number], type: audio/webm
📡 Sending audio to Hume AI EVI, size: [number]
```

## Common Issues & Solutions

### Issue 1: Environment Variables Not Set
**Symptoms**: "Missing" in API key status logs
**Solution**: Add to Vercel environment variables:
```
NEXT_PUBLIC_HUME_API_KEY=cL5dGCBT1EAaAau7eNA84WVfQ3QpS3t2WRZgZvhwYUWhgN0V
NEXT_PUBLIC_HUME_CONFIG_ID=8f16326f-a45d-4433-9a12-890120244ec3
```

### Issue 2: WebSocket Connection Failed
**Symptoms**: "Failed to connect to Hume AI" or WebSocket errors
**Possible Causes**:
1. API key invalid/expired
2. EVI configuration ID wrong
3. Network/firewall blocking WebSocket
4. Hume AI service down

**Debug Steps**:
1. Test API key with direct API call
2. Verify config ID in Hume AI dashboard
3. Check network console for WebSocket errors

### Issue 3: Microphone Not Working
**Symptoms**: No audio data being sent
**Solutions**:
1. Grant microphone permission when prompted
2. Check browser microphone settings
3. Try different browser
4. Ensure HTTPS (should be automatic on Vercel)

### Issue 4: Audio Not Processing
**Symptoms**: Microphone works but no audio chunks sent
**Possible Causes**:
1. MediaRecorder not supported
2. Audio format incompatible
3. WebSocket not ready

### Issue 5: Hume AI Not Responding
**Symptoms**: Audio sent but no responses
**Possible Causes**:
1. EVI configuration issues
2. Audio format problems
3. API quota exceeded
4. Hume AI processing errors

## Manual Test Commands

### Test in Browser Console:
```javascript
// Check environment variables
console.log('API Key:', process.env.NEXT_PUBLIC_HUME_API_KEY ? 'Present' : 'Missing');
console.log('Config ID:', process.env.NEXT_PUBLIC_HUME_CONFIG_ID ? 'Present' : 'Missing');

// Test microphone access
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('✅ Microphone access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Microphone error:', err));

// Test WebSocket connection
const ws = new WebSocket('wss://api.hume.ai/v0/evi/chat?config_id=8f16326f-a45d-4433-9a12-890120244ec3&api_key=cL5dGCBT1EAaAau7eNA84WVfQ3QpS3t2WRZgZvhwYUWhgN0V');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (err) => console.error('❌ WebSocket error:', err);
ws.onclose = (event) => console.log('🔌 WebSocket closed:', event.code, event.reason);
```

## Step-by-Step Debug Process

1. **Visit**: https://ai-career-platform.vercel.app/quest
2. **Open**: Browser Developer Tools (F12)
3. **Go to**: Console tab
4. **Click**: "Start Quest" button
5. **Watch**: Console output for error messages
6. **Check**: Network tab for WebSocket connections
7. **Grant**: Microphone permission if prompted
8. **Verify**: Audio is being processed

## Expected Successful Flow:
```
🔑 Hume API Key status: Present (cL5dGCBT...)
⚙️ Hume Config ID status: Present (8f16326f...)
🔗 Connecting to Hume AI EVI with Config ID: 8f16326f...
✅ Connected to Hume AI EVI WebSocket
🎤 Microphone access granted
🎵 Started audio streaming to Hume AI
🎤 Audio data available, size: [number]
📡 Sending audio to Hume AI EVI, size: [number]
📨 Hume AI message received: [response]
```

If you see all these messages, the integration is working correctly!