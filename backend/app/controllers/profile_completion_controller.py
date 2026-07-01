from app.services.profile_completion_service import (
    get_my_profile_completion,
    update_my_profile,
    get_company_profile_completion_overview,
    set_threshold,
    recalculate_employee_completion,
)


def fetch_my_profile_completion(employee_id, company_id):
    return get_my_profile_completion(employee_id, company_id)


def patch_my_profile(employee_id, data):
    return update_my_profile(employee_id, data)


def fetch_company_profile_completion(company_id, actor_email=None, below_threshold_only=False, custom_threshold=None):
    return get_company_profile_completion_overview(
        company_id, actor_email, below_threshold_only, custom_threshold
    )


def update_completion_threshold(company_id, threshold, admin_name="Admin", actor_email=None):
    return set_threshold(company_id, threshold, admin_name, actor_email)


def refresh_completion_score(employee_id, company_id, actor_name="System"):
    return recalculate_employee_completion(employee_id, company_id, actor_name)
