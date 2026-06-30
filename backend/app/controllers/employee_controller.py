from app.services.employee_service import (
    get_all_employees,
    get_employee_by_id,
    get_employee_by_email,
    sync_login_employee,
    add_employee,
    update_employee,
    delete_employee,
    suspend_employee,
    reinstate_employee,
    transfer_employee_department,
    get_department_transfer_history,
    import_jsonplaceholder_users,
)


def import_users():
    return import_jsonplaceholder_users()


def fetch_all_employees(company_id, actor_email=None):
    return get_all_employees(company_id, actor_email)


def fetch_employee_by_id(employee_id, company_id=None):
    return get_employee_by_id(employee_id, company_id)


def fetch_employee_by_email(email, company_id=1):
    return get_employee_by_email(email, company_id)


def sync_employee_for_login(data):
    return sync_login_employee(data)


def create_employee(employee_data):
    return add_employee(employee_data)


def edit_employee(employee_id, data):
    return update_employee(employee_id, data)


def remove_employee(employee_id, company_id=None, admin_name="Admin", actor_email=None):
    return delete_employee(employee_id, company_id, admin_name, actor_email)


def suspend_user(employee_id, data):
    return suspend_employee(employee_id, data)


def reinstate_user(employee_id, company_id, admin_name="Admin", actor_email=None):
    return reinstate_employee(employee_id, company_id, admin_name, actor_email)


def transfer_department(employee_id, data):
    return transfer_employee_department(employee_id, data)


def fetch_department_transfer_history(company_id=None, employee_id=None):
    return get_department_transfer_history(company_id, employee_id)

