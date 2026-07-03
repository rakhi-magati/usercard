import { useCallback, useEffect, useState } from "react";
import { FaEdit, FaPlus, FaRedo, FaSearch, FaStar, FaTrash, FaUndoAlt } from "react-icons/fa";
import {
    createHoliday, deleteHoliday, getHolidays, restoreHoliday, updateHoliday,
} from "../../services/holidayService";
import "./HolidayCalendar.css";

//  constants 
const TYPES = ["Public Holiday", "Company Holiday", "Optional Holiday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => thisYear - 1 + i);
const todayISO = new Date().toISOString().split("T")[0];

const emptyForm = { name: "", date: "", description: "", holiday_type: "Public Holiday", is_recurring: false };

// ── helpers 
function parseLocalDate(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function typeBadgeClass(type) {
    if (type === "Public Holiday") return "hc-badge-public";
    if (type === "Company Holiday") return "hc-badge-company";
    if (type === "Optional Holiday") return "hc-badge-optional";
    return "";
}

function typeStatIcon(type) {
    if (type === "Public Holiday") return "🌍";
    if (type === "Company Holiday") return "💼";
    if (type === "Optional Holiday") return "⭐";
    return "📅";
}

// ── calendar grid builder ──
function buildCalendarDays(year, month) {
    // month is 1-based
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0);
    // Mon=0 … Sun=6
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
}

function HolidayCalendar() {
    // const role = (localStorage.getItem("role") || "user").toLowerCase();
    const role = (localStorage.getItem("role") || "user").toLowerCase();

    const companyId = parseInt(localStorage.getItem("company_id") || "1");

    const companyName =
        companyId === 1
            ? "Company A"
            : companyId === 2
                ? "Company B"
                : `Company ${companyId}`;

    const isAdmin = role === "admin";
    /* ── filter state ── */
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState(String(thisYear));
    const [filterType, setFilterType] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    /* ── calendar preview state ── */
    const now = new Date();
    const [calYear, setCalYear] = useState(now.getFullYear());
    const [calMonth, setCalMonth] = useState(now.getMonth() + 1); // 1-based

    /* ── data ── */
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ── modal ── */
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    /* ── fetch ── */
    const fetchHolidays = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const data = await getHolidays({
                companyId,
                month: filterMonth ? parseInt(filterMonth) : undefined,
                year: filterYear ? parseInt(filterYear) : undefined,
                holidayType: filterType || undefined,
                search: searchTerm || undefined,
            });
            setHolidays(data);
        } catch {
            setError("Failed to load holidays. Ensure the backend is running.");
        } finally { setLoading(false); }
    }, [companyId, filterMonth, filterYear, filterType, searchTerm]);

    useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

    /* ── derived counts ── */
    const active = holidays.filter((h) => !h.is_deleted);
    const countPublic = active.filter((h) => h.holiday_type === "Public Holiday").length;
    const countCompany = active.filter((h) => h.holiday_type === "Company Holiday").length;
    const countOptional = active.filter((h) => h.holiday_type === "Optional Holiday").length;
    const countRecurring = active.filter((h) => h.is_recurring).length;

    /* ── upcoming (next 5 from today, across all loaded) ── */
    const upcoming = [...active]
        .filter((h) => h.date >= todayISO)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8);

    const nextHoliday = upcoming[0] || null;

    /* ── holidays on calendar month ── */
    const calHolidayDates = new Set(
        active
            .filter((h) => {
                const d = parseLocalDate(h.date);
                return d.getFullYear() === calYear && d.getMonth() + 1 === calMonth;
            })
            .map((h) => parseLocalDate(h.date).getDate())
    );

    const calCells = buildCalendarDays(calYear, calMonth);

    /* ── table rows (apply all filters inline) ── */
    const tableRows = active.filter((h) => {
        if (filterType && h.holiday_type !== filterType) return false;
        if (filterMonth) {
            const m = parseInt(filterMonth);
            if (parseLocalDate(h.date).getMonth() + 1 !== m) return false;
        }
        if (filterYear) {
            if (parseLocalDate(h.date).getFullYear() !== parseInt(filterYear)) return false;
        }
        if (searchTerm) {
            if (!h.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        }
        return true;
    }).sort((a, b) => a.date.localeCompare(b.date));

    /* ── modal helpers ── */
    const openCreate = () => { setEditId(null); setForm(emptyForm); setFormError(""); setShowModal(true); };
    const openEdit = (h) => {
        setEditId(h.id);
        setForm({ name: h.name, date: h.date, description: h.description || "", holiday_type: h.holiday_type, is_recurring: h.is_recurring });
        setFormError(""); setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditId(null); setForm(emptyForm); setFormError(""); };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { setFormError("Holiday name is required."); return; }
        if (!form.date) { setFormError("Holiday date is required."); return; }
        setSaving(true); setFormError("");
        try {
            const payload = { ...form, company_id: companyId };
            if (editId) {
                const updated = await updateHoliday(editId, payload);
                setHolidays((prev) => prev.map((h) => h.id === editId ? updated : h));
            } else {
                const created = await createHoliday(payload);
                setHolidays((prev) => [created, ...prev]);
            }
            closeModal();
        } catch (err) {
            setFormError(err?.response?.data?.detail || "Failed to save holiday.");
        } finally { setSaving(false); }
    };

    const handleDelete = async (h) => {
        if (!window.confirm(`Delete holiday "${h.name}"?`)) return;
        try {
            await deleteHoliday(h.id, companyId);
            setHolidays((prev) => prev.map((x) => x.id === h.id ? { ...x, is_deleted: true } : x));
        } catch (err) { setError(err?.response?.data?.detail || "Failed to delete."); }
    };

    const handleRestore = async (h) => {
        try {
            const restored = await restoreHoliday(h.id, companyId);
            setHolidays((prev) => prev.map((x) => x.id === h.id ? restored : x));
        } catch (err) { setError(err?.response?.data?.detail || "Failed to restore."); }
    };

    /* ── calendar nav ── */
    const prevMonth = () => {
        if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); }
        else setCalMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); }
        else setCalMonth((m) => m + 1);
    };

    /* RENDER */
    return (
        <div className="hc-page">

            {/* ── Top bar ── */}
            <div className="hc-topbar">
                <div>
                    <h1 className="hc-title">Company Holiday Calendar</h1>
                    <p className="hc-subtitle">Manage company holidays and keep attendance aligned with official non-working days.</p>
                </div>
                <div className="hc-topbar-right">
                    <span className="hc-company-badge">
                        Company: {companyName}
                    </span>
                    {isAdmin && (
                        <button className="hc-add-btn" onClick={openCreate}>
                            <FaPlus /> Add Holiday
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="hc-error-bar">{error}</div>}

            {/* ── Stat cards ── */}
            <div className="hc-stats-row">
                <div className="hc-stat-card">
                    <span className="hc-stat-icon">🎉</span>
                    <div>
                        <div className="hc-stat-num">{active.length}</div>
                        <div className="hc-stat-lbl">Total Holidays</div>
                    </div>
                </div>
                <div className="hc-stat-card">
                    <span className="hc-stat-icon">🌍</span>
                    <div>
                        <div className="hc-stat-num">{countPublic}</div>
                        <div className="hc-stat-lbl">Public Holidays</div>
                    </div>
                </div>
                <div className="hc-stat-card">
                    <span className="hc-stat-icon">💼</span>
                    <div>
                        <div className="hc-stat-num">{countCompany}</div>
                        <div className="hc-stat-lbl">Company Holidays</div>
                    </div>
                </div>
                <div className="hc-stat-card">
                    <span className="hc-stat-icon">⭐</span>
                    <div>
                        <div className="hc-stat-num">{countOptional}</div>
                        <div className="hc-stat-lbl">Optional Holidays</div>
                    </div>
                </div>
            </div>

            {/* ── Main two-column layout ── */}
            <div className="hc-main-grid">

                {/* ══ LEFT: filters + list ══ */}
                <div className="hc-left-panel">

                    {/* Search */}
                    <div className="hc-search-wrap">
                        <FaSearch className="hc-search-icon" />
                        <input
                            className="hc-search-input"
                            placeholder="Search holiday"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Dropdowns */}
                    <div className="hc-dropdown-row">
                        <div className="hc-dropdown-wrap">
                            <select
                                className="hc-dropdown"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="">Holiday Type</option>
                                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="hc-dropdown-arrow">▾</span>
                        </div>

                        <div className="hc-dropdown-wrap">
                            <select
                                className="hc-dropdown"
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                            >
                                <option value="">All Months</option>
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={String(i + 1)}>{m}</option>
                                ))}
                            </select>
                            <span className="hc-dropdown-arrow">▾</span>
                        </div>

                        <div className="hc-dropdown-wrap">
                            <select
                                className="hc-dropdown"
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                            >
                                <option value="">All Years</option>
                                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span className="hc-dropdown-arrow">▾</span>
                        </div>
                    </div>

                    {/* Holiday list */}
                    <div className="hc-list-header">
                        <div>
                            <div className="hc-list-title">Holiday List</div>
                            <div className="hc-list-sub">Upcoming and recurring holidays</div>
                        </div>
                        <div className="hc-list-pills">
                            {countRecurring > 0 && (
                                <span className="hc-pill hc-pill-blue">Recurring {countRecurring}</span>
                            )}
                            {nextHoliday && (
                                <span className="hc-pill hc-pill-green">Next {nextHoliday.name}</span>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="hc-loading">Loading…</div>
                    ) : tableRows.length === 0 ? (
                        <div className="hc-empty-table">No holidays found.</div>
                    ) : (
                        <div className="hc-table-wrap">
                            <table className="hc-table">
                                <thead>
                                    <tr>
                                        <th>Holiday Name</th>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Recurring</th>
                                        <th>Description</th>
                                        {isAdmin && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableRows.map((h) => (
                                        <tr key={h.id} className={h.is_deleted ? "hc-row-deleted" : ""}>
                                            <td className="hc-col-name">{h.name}</td>
                                            <td className="hc-col-date">{h.date}</td>
                                            <td>
                                                <span className={`hc-type-badge ${typeBadgeClass(h.holiday_type)}`}>
                                                    {h.holiday_type}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`hc-recurring-cell ${h.is_recurring ? "yes" : "no"}`}>
                                                    {h.is_recurring ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="hc-col-desc">{h.description || "—"}</td>
                                            {isAdmin && (
                                                <td>
                                                    <div className="hc-action-btns">
                                                        {!h.is_deleted ? (
                                                            <>
                                                                <button className="hc-icon-btn hc-icon-edit" onClick={() => openEdit(h)} title="Edit">
                                                                    <FaEdit />
                                                                </button>
                                                                <button className="hc-icon-btn hc-icon-delete" onClick={() => handleDelete(h)} title="Delete">
                                                                    <FaTrash />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button className="hc-icon-btn hc-icon-restore" onClick={() => handleRestore(h)} title="Restore">
                                                                <FaUndoAlt />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ══ RIGHT: calendar + upcoming ══ */}
                <div className="hc-right-panel">

                    {/* Mini calendar */}
                    <div className="hc-cal-card">
                        <div className="hc-cal-nav">
                            <button className="hc-cal-nav-btn" onClick={prevMonth}>‹</button>
                            <div className="hc-cal-heading">
                                <span className="hc-cal-month-name">📅 {MONTHS[calMonth - 1]}</span>
                                <span className="hc-cal-sub">Monthly preview</span>
                            </div>
                            <button className="hc-cal-nav-btn" onClick={nextMonth}>›</button>
                        </div>

                        <div className="hc-cal-grid">
                            {DAYS.map((d) => (
                                <div key={d} className="hc-cal-dow">{d}</div>
                            ))}
                            {calCells.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} />;
                                const iso = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                                const isToday = iso === todayISO;
                                const isHoliday = calHolidayDates.has(day);
                                return (
                                    <div
                                        key={day}
                                        className={`hc-cal-day ${isToday ? "hc-cal-today" : ""} ${isHoliday ? "hc-cal-holiday-day" : ""}`}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Upcoming list */}
                    <div className="hc-upcoming-card">
                        <div className="hc-upcoming-header">
                            <span className="hc-upcoming-star">✨</span>
                            <div>
                                <div className="hc-upcoming-title">Upcoming</div>
                                <div className="hc-upcoming-sub">Next holidays to review</div>
                            </div>
                        </div>

                        {upcoming.length === 0 ? (
                            <div className="hc-upcoming-empty">No upcoming holidays.</div>
                        ) : (
                            <div className="hc-upcoming-list">
                                {upcoming.map((h) => (
                                    <div key={h.id} className="hc-upcoming-item">
                                        <div className="hc-upcoming-info">
                                            <div className="hc-upcoming-name">{h.name}</div>
                                            <div className="hc-upcoming-date">{h.date}</div>
                                        </div>
                                        {h.is_recurring && (
                                            <span className="hc-upcoming-recurring">Recurring</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Create / Edit Modal ── */}
            {showModal && (
                <div className="hc-overlay" onClick={closeModal}>
                    <div className="hc-modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="hc-modal-title">{editId ? "Edit Holiday" : "Add Holiday"}</h2>

                        {formError && <div className="hc-modal-error">{formError}</div>}

                        <form onSubmit={handleSave} className="hc-form">
                            <div className="hc-field">
                                <label>Holiday Name <span className="hc-req">*</span></label>
                                <input type="text" placeholder="e.g. New Year's Day"
                                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="hc-field">
                                <label>Date <span className="hc-req">*</span></label>
                                <input type="date" value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div className="hc-field">
                                <label>Holiday Type</label>
                                <select value={form.holiday_type}
                                    onChange={(e) => setForm({ ...form, holiday_type: e.target.value })}>
                                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="hc-field">
                                <label>Description</label>
                                <textarea rows={3} placeholder="Optional description…"
                                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="hc-field hc-check-field">
                                <input id="hc-recurring" type="checkbox" checked={form.is_recurring}
                                    onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
                                <label htmlFor="hc-recurring">
                                    <FaRedo style={{ marginRight: 6, fontSize: 11 }} />
                                    Recurring annually
                                </label>
                            </div>
                            <div className="hc-modal-footer">
                                <button type="button" className="hc-btn-cancel" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="hc-btn-save" disabled={saving}>
                                    {saving ? "Saving…" : editId ? "Save Changes" : "Create Holiday"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default HolidayCalendar;
