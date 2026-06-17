import axios from "axios";

const API = "http://127.0.0.1:8000/employees";

export const getEmployees = async () => {
  const response = await axios.get(API);

  return response.data.data;
};

export const addEmployee = async (employee) => {
  const response = await axios.post(
    API,
    employee
  );

  return response.data;
};

export const updateEmployee = async (
  id,
  employee
) => {
  const response = await axios.put(
    `${API}/${id}`,
    employee
  );

  return response.data;
};

export const deleteEmployee = async (
  id
) => {
  const response = await axios.delete(
    `${API}/${id}`
  );

  return response.data;
};