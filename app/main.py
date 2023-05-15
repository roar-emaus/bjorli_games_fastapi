from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from pydantic import BaseModel
from typing import List, Dict, Tuple
import csv
import datetime

bjorlileika_app = FastAPI()
# Add CORS middleware to FastAPI app
bjorlileika_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # List of allowed origins, use ["*"] to allow all
    allow_credentials=True,
    allow_methods=["*"],  # List of allowed methods, use ["*"] to allow all
    allow_headers=["*"],  # List of allowed headers, use ["*"] to allow all
)

DATA_FOLDER = Path("data")


class ScoreData(BaseModel):
    games: List[str]
    scores: List[Dict[str, int | str]]


def get_latest_score_file(year: str, month: str) -> Tuple[Path, bool]:
    target_folder = DATA_FOLDER / f"{year}_{month}"

    if not target_folder.exists():
        raise FileNotFoundError(f"Folder {target_folder} does not exist.")

    csv_files = sorted(target_folder.glob("poeng_*.csv"), reverse=True)

    if not csv_files:
        raise FileNotFoundError(f"No score files found in {target_folder}")
    locked = False
    if (target_folder/".lock").exists():
        locked = True
    return csv_files[0], locked


@bjorlileika_app.get("/bjorlileikane/{year}/{month}")
async def get_score(year: str, month: str):
    try:
        latest_score_file, locked = get_latest_score_file(year, month)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    with latest_score_file.open() as file:
        reader = csv.reader(file)
        data = [row for row in reader]
    return {"data": data, "header": "", "locked": locked}


@bjorlileika_app.get("/bjorlileikane/alleleika")
async def get_games():
    available_games = []
    for subdir in DATA_FOLDER.iterdir():
        if subdir.is_dir():
            year_month = subdir.name.split("_")
            if len(year_month) == 2 and len(list(subdir.glob("*poeng*.csv"))) > 0:
                available_games.append(f"{subdir.name}")
    return {"data": available_games}


@bjorlileika_app.post("/bjorlileikane/{year}/{month}")
async def post_score(year: str, month: str, score_data: ScoreData):

    target_folder = DATA_FOLDER / f"{year}_{month}"
    target_folder.mkdir(parents=True, exist_ok=True)
    if (target_folder/".lock").exists():
        return {"detail": f"{target_folder} is locked"}
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    new_score_file = target_folder / f"poeng_{timestamp}.csv"
    with new_score_file.open("w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(score_data.games)
        for scores in score_data.scores:
            writer.writerow(
                [scores["Deltager"]] + [scores[game] for game in score_data.games[1:]]
            )
    
    return {"detail": f"New score file {new_score_file} created."}
