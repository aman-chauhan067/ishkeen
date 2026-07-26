from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from typing import Dict, Any

from app.api.deps import get_inference_service
from app.services.inference_service import InferenceService

router = APIRouter(prefix="/dev", tags=["Developer Debug Mode"])

@router.post("/inference-debug")
async def inference_debug(
    file: UploadFile = File(...),
    inference: InferenceService = Depends(get_inference_service)
):
    """
    Developer Mode endpoint. Runs the full Hybrid CV pipeline and returns
    all raw data including Face Mesh visualization, OpenCV metrics, Gemini JSON,
    and the final Canonical Evidence Graph.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    img_bytes = await file.read()
    
    try:
        debug_data = inference.dev_debug(img_bytes)
        return debug_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/debug-ui", response_class=HTMLResponse)
async def dev_debug_ui():
    """
    Returns a standalone HTML page for testing the Hybrid CV Pipeline.
    """
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Ishkeen Dev Debug Mode</title>
        <style>
            body { font-family: system-ui, sans-serif; background: #111; color: #eee; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .panel { background: #222; padding: 20px; border-radius: 8px; }
            pre { background: #000; padding: 15px; overflow-x: auto; border-radius: 4px; color: #0f0; }
            img { max-width: 100%; border-radius: 4px; }
            button, input { padding: 10px; margin-top: 10px; }
            button { background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background: #2563eb; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Hybrid Inference Debugger</h1>
            <div class="panel">
                <input type="file" id="imageInput" accept="image/*" />
                <button onclick="analyze()">Run Pipeline</button>
                <div id="status" style="margin-top: 10px; color: #aaa;"></div>
            </div>
            
            <div class="grid" style="margin-top: 20px;" id="results" style="display: none;">
                <div class="panel">
                    <h3>MediaPipe + OpenCV Visualization</h3>
                    <img id="devImg" src="" />
                </div>
                <div class="panel">
                    <h3>Raw OpenCV Metrics</h3>
                    <pre id="cvMetrics"></pre>
                </div>
                <div class="panel">
                    <h3>Gemini Semantic JSON</h3>
                    <pre id="geminiJson"></pre>
                </div>
                <div class="panel">
                    <h3>Final Canonical Evidence Graph</h3>
                    <pre id="evidenceGraph"></pre>
                </div>
            </div>
        </div>
        
        <script>
            async function analyze() {
                const fileInput = document.getElementById('imageInput');
                if (!fileInput.files[0]) return alert("Select an image");
                
                document.getElementById('status').innerText = "Running... (this takes ~3-5 seconds with Gemini)";
                
                const formData = new FormData();
                formData.append("file", fileInput.files[0]);
                
                try {
                    const res = await fetch('/api/v1/dev/inference-debug', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.detail || "API Error");
                    
                    document.getElementById('devImg').src = "data:image/jpeg;base64," + data.dev_visualization_b64;
                    document.getElementById('cvMetrics').innerText = JSON.stringify(data.cv_metrics, null, 2);
                    document.getElementById('geminiJson').innerText = JSON.stringify(data.gemini_raw_json, null, 2);
                    document.getElementById('evidenceGraph').innerText = JSON.stringify(data.final_evidence_graph, null, 2);
                    document.getElementById('results').style.display = 'grid';
                    
                    document.getElementById('status').innerText = "Done!";
                } catch (e) {
                    document.getElementById('status').innerText = "Error: " + e.message;
                }
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

