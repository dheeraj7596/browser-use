from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from browser_use import Agent  # Import your existing Agent class
from langchain_openai import ChatOpenAI
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    task: str

@app.post("/run-agent")
async def run_agent(task: Task):
    agent = Agent(
        task=task.task,
        llm=ChatOpenAI(model="gpt-4o"),
        number_of_browser_windows=2,
        explorer_llm=ChatOpenAI(model="gpt-4o"),
        exploring_step=1,
        consolidator_llm=ChatOpenAI(model="gpt-4o"),
        generate_gif=os.path.join("/Users/dheerajmekala/Work/browser-use/agent_history.gif"),
    )
    result = await agent.run()
    return {"result": result}