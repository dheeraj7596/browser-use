from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio
from browser_use import Agent
from browser_use.browser.callback import BrowserStatusCallback
import os
from langchain_openai import ChatOpenAI

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active WebSocket connections
active_connections: List[WebSocket] = []


class Task(BaseModel):
    task: str


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        active_connections.remove(websocket)




@app.post("/run-agent")
async def run_agent(task: Task):
    browser_callback = BrowserStatusCallback(active_connections)

    try:
        agent = Agent(
            task=task.task,
            llm=ChatOpenAI(model="gpt-4o"),
            number_of_browser_windows=4,
            explorer_llm=ChatOpenAI(model="gpt-4o"),
            exploring_step=1,
            consolidator_llm=ChatOpenAI(model="gpt-4o"),
            generate_gif=os.path.join("/Users/dheerajmekala/Work/browser-use/agent_history_browser.gif"),
            browser_callback=browser_callback  # Pass the callback
        )

        # Run the agent and get results
        _ = await agent.run()

        # Convert the results to a response format
        response = {
            "result": agent._consolidated_result,
            "status": "success"
        }

        return response

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
