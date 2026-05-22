from pydantic import BaseModel


class Employee(BaseModel):
    id: int
    name: str
    role: str
    department: str
    email: str