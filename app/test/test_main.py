from fastapi.testclient import TestClient
import pytest
import json
from pathlib import Path
import shutil
import csv
import datetime

from main import bjorlileika_app, DATA_FOLDER, ScoreData


client = TestClient(bjorlileika_app)

# Sample score data for testing
score_data = ScoreData(
    games=["Deltager", "Game1", "Game2", "Game3"],
    scores=[
        {"Deltager": "Alice", "Game1": 1, "Game2": 2, "Game3": 3},
        {"Deltager": "Bob", "Game1": 4, "Game2": 3, "Game3": 2},
        {"Deltager": "Eve", "Game1": 3, "Game2": 4, "Game3": 1},
    ],
)


def setup_function():
    # Create test folder and sample score file
    test_folders = [Path("data") / "1000_05", Path("data") / "1000_06"]
    for test_folder in test_folders:
        test_folder.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        test_file = test_folder / f"poeng_{timestamp}.csv"
        with test_file.open("w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(score_data.games)
            for scores in score_data.scores:
                writer.writerow(
                    [scores["Deltager"]] + [scores[game] for game in score_data.games[1:]]
                )


def teardown_function():
    # Remove test folder after test execution
    test_folder = Path("data") / "1000_05"
    shutil.rmtree(test_folder)
    test_folder = Path("data") / "1000_06"
    shutil.rmtree(test_folder)


@pytest.mark.parametrize("year,month", [("1000", "05")])
def test_get_score(year, month):
    response = client.get(f"/bjorlileikane/{year}/{month}")
    assert response.status_code == 200
    assert response.json() == {
        "data": [
            ["Deltager", "Game1", "Game2", "Game3"],
            ["Alice", "1", "2", "3"],
            ["Bob", "4", "3", "2"],
            ["Eve", "3", "4", "1"],
        ],
        "header": ""
    }


@pytest.mark.parametrize("year,month", [("1000", "08")])
def test_get_score_nonexistent_folder(year, month):
    response = client.get(f"/bjorlileikane/{year}/{month}")
    assert response.status_code == 404
    assert response.json() == {"detail": f"Folder data/{year}_{month} does not exist."}


@pytest.mark.parametrize("year,month", [("1000", "05")])
def test_post_score(year, month):
    response = client.post(f"/bjorlileikane/{year}/{month}", json=score_data.dict())
    assert response.status_code == 200
    assert "New score file data/1000_05/poeng_" in response.json()["detail"]


def test_get_games_with_data():

    # Create test subfolders with some score files
    test_folder1 = DATA_FOLDER / "1000_05"
    (test_folder1 / "poeng_10000501000000.csv").write_text("test content")

    test_folder2 = DATA_FOLDER / "1000_06"
    (test_folder2 / "poeng_10000601000000.csv").write_text("test content")

    response = client.get("/bjorlileikane/alleleika")

    assert response.status_code == 200
    for year_month in ["1000/05", "1000/06"]:
        assert year_month in response.json()["data"]

