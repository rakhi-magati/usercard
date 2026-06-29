import { useMemo, useState } from "react";
import {
  FaBell,
  FaChartBar,
  FaClipboardList,
  FaDownload,
  FaFileAlt,
  FaFileCsv,
  FaFileExcel,
  FaFilePdf,
  FaHistory,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import {
  exportDatasets,
  exportFormats,
  getExportHistory,
  runDataExport,
} from "../../services/exportService";
import "./DataExportCenter.css";

const datasetIcons = {
  employees: <FaUsers />,
  attendance: <FaClipboardList />,
  leaveRequests: <FaFileAlt />,
  auditLogs: <FaShieldAlt />,
  notifications: <FaBell />,
  analytics: <FaChartBar />,
};

const formatIcons = {
  csv: <FaFileCsv />,
  excel: <FaFileExcel />,
  pdf: <FaFilePdf />,
};

const formatDateTime = (value) => value ? new Date(value).toLocaleString() : "-";

function DataExportCenter() {
  const role = localStorage.getItem("role")?.toLowerCase() || "user";
  const companyId = localStorage.getItem("company_id") || "1";
  const companyName = localStorage.getItem("company_name") || `Company ${companyId}`;
  const exportedBy = localStorage.getItem("userName") || localStorage.getItem("name") || "Admin";
  const [datasetId, setDatasetId] = useState("employees");
  const [formatId, setFormatId] = useState("csv");
  const [history, setHistory] = useState(() => getExportHistory(companyId));
  const [status, setStatus] = useState({ type: "", message: "" });
  const [exporting, setExporting] = useState(false);

  const selectedDataset = useMemo(
    () => exportDatasets.find((dataset) => dataset.id === datasetId),
    [datasetId]
  );

  const handleExport = async () => {
    if (role !== "admin" || exporting) return;

    setExporting(true);
    setStatus({ type: "", message: "" });

    try {
      const item = await runDataExport({ datasetId, formatId, companyId, exportedBy });
      setHistory((current) => [item, ...current]);
      setStatus({ type: "success", message: `${item.data_type} exported as ${item.format}.` });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Export failed. Please try again." });
    } finally {
      setExporting(false);
    }
  };

  if (role !== "admin") {
    return (
      <div className="export-center-page">
        <div className="export-empty-state">Only company admins can access the Data Export Center.</div>
      </div>
    );
  }

  return (
    <div className="export-center-page">
      <div className="export-header">
        <div>
          <h1>Data Export Center</h1>
          <p>{companyName} exports are scoped to this company and recorded in audit logs.</p>
        </div>
        <div className="export-header-badge">
          <FaDownload />
          <span>Admin Export</span>
        </div>
      </div>

      <section className="export-workspace">
        <div className="export-section-title">
          <h2>Choose Data</h2>
          <span>{selectedDataset?.label}</span>
        </div>

        <div className="dataset-grid">
          {exportDatasets.map((dataset) => (
            <button
              type="button"
              className={`dataset-card ${datasetId === dataset.id ? "active" : ""}`}
              key={dataset.id}
              onClick={() => setDatasetId(dataset.id)}
            >
              <span className="dataset-icon">{datasetIcons[dataset.id]}</span>
              <strong>{dataset.label}</strong>
              <small>{dataset.description}</small>
            </button>
          ))}
        </div>

        <div className="format-panel">
          <div>
            <h2>Export Format</h2>
            <p>CSV for spreadsheets, Excel for formatted tables, PDF for printable reports.</p>
          </div>

          <div className="format-options" role="radiogroup" aria-label="Export format">
            {exportFormats.map((format) => (
              <button
                type="button"
                key={format.id}
                className={formatId === format.id ? "active" : ""}
                onClick={() => setFormatId(format.id)}
                role="radio"
                aria-checked={formatId === format.id}
              >
                {formatIcons[format.id]}
                {format.label}
              </button>
            ))}
          </div>
        </div>

        {status.message && <div className={`export-status ${status.type}`}>{status.message}</div>}

        <div className="export-action-row">
          <div>
            <strong>{selectedDataset?.label}</strong>
            <span>Exported by {exportedBy}</span>
          </div>
          <button className="export-primary-btn" type="button" onClick={handleExport} disabled={exporting}>
            <FaDownload />
            {exporting ? "Preparing..." : "Export Data"}
          </button>
        </div>
      </section>

      <section className="export-history-card">
        <div className="export-history-header">
          <h2><FaHistory /> Export History</h2>
          <span>{history.length} records</span>
        </div>

        <div className="export-table-wrap">
          <table className="export-history-table">
            <thead>
              <tr>
                <th>Who Exported</th>
                <th>When</th>
                <th>What Data</th>
                <th>Format</th>
                <th>Rows</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.exported_by}</td>
                    <td>{formatDateTime(item.exported_at)}</td>
                    <td>{item.data_type}</td>
                    <td><span className="format-pill">{item.format}</span></td>
                    <td>{item.row_count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No exports have been created for this company yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DataExportCenter;
