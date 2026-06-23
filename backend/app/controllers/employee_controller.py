from app.services.employee_service import (
    get_all_employees,
    get_employee_by_id,
    add_employee,
    update_employee,
    delete_employee,
    transfer_employee_department,
    get_department_transfer_history,
)
from app.services.employee_service import (
    import_jsonplaceholder_users
)

def import_users():
    return import_jsonplaceholder_users()


def fetch_all_employees(company_id):
    return get_all_employees(company_id)

def fetch_employee_by_id(
    employee_id
):
    return get_employee_by_id(
        employee_id
    )


def create_employee(
    employee_data
):
    return add_employee(
        employee_data
    )


def edit_employee(
    employee_id,
    data
):
    return update_employee(
        employee_id,
        data
    )


def remove_employee(
    employee_id
):
    return delete_employee(
        employee_id
    )

def transfer_department(employee_id, data):
    return transfer_employee_department(
        employee_id,
        data
    )



def fetch_department_transfer_history(company_id=None, employee_id=None):
    return get_department_transfer_history(
        company_id,
        employee_id
    )
