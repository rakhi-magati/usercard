import requests

BASE_URL = "https://jsonplaceholder.typicode.com/users"


def get_all_employees():
    response = requests.get(BASE_URL)

    if response.status_code == 200:
        return response.json()

    return []


def get_employee_by_id(employee_id: int):
    response = requests.get(
        f"{BASE_URL}/{employee_id}"
    )

    if response.status_code == 200:
        return response.json()

    return None