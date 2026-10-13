import { useEffect, useState } from "react";
import { api, formatCurrency } from "../lib/api";

function cloneValues(values) {
	return JSON.parse(JSON.stringify(values));
}

function renderValue(field, value) {
	if (field.type === "currency") {
		return formatCurrency(value);
	}

	return value || "-";
}

export function EntityManager({ title, description, resource, fields, columns, initialValues, readOnly = false }) {
	const [items, setItems] = useState([]);
	const [formValue, setFormValue] = useState(() => cloneValues(initialValues));
	const [editingId, setEditingId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const visibleColumns = readOnly ? columns.filter((column) => column.key !== "salary") : columns;

	useEffect(() => {
		let active = true;

		api
			.list(resource)
			.then((data) => {
				if (active) {
					setItems(data.items);
				}
			})
			.catch((requestError) => {
				if (active) {
					setError(requestError.message);
				}
			})
			.finally(() => {
				if (active) {
					setLoading(false);
				}
			});

		return () => {
			active = false;
		};
	}, [resource]);

	function updateField(name, value) {
		setFormValue((current) => ({ ...current, [name]: value }));
	}

	function updateFileField(name, file) {
		if (!file) {
			updateField(name, "");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			updateField(name, String(reader.result || ""));
		};
		reader.readAsDataURL(file);
	}

	function resetForm() {
		setEditingId(null);
		setFormValue(cloneValues(initialValues));
	}

	function editItem(item) {
		setEditingId(item.id);
		setFormValue({ ...cloneValues(initialValues), ...item });
	}

	async function handleSubmit(event) {
		event.preventDefault();
		if (readOnly) {
			return;
		}

		setSaving(true);
		setError("");

		try {
			const payload = { ...formValue };
			const response = editingId ? await api.update(resource, editingId, payload) : await api.create(resource, payload);

			setItems((current) => {
				if (editingId) {
					return current.map((item) => (item.id === editingId ? response.item : item));
				}

				return [response.item, ...current];
			});

			resetForm();
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(id) {
		if (readOnly || !window.confirm(`Delete this ${title.toLowerCase().replace(/s$/, "")} record?`)) {
			return;
		}

		try {
			await api.remove(resource, id);
			setItems((current) => current.filter((item) => item.id !== id));
			if (editingId === id) {
				resetForm();
			}
		} catch (requestError) {
			setError(requestError.message);
		}
	}

	return (
		<section className="section-card">
			<div className="section-header compact">
				<div>
					<p className="eyebrow">{title}</p>
					<h2>{description}</h2>
				</div>
			</div>

			<div className="crud-layout">
				{!readOnly ? (
					<form className="crud-form" onSubmit={handleSubmit}>
						<div className="form-grid">
							{fields.map((field) => (
								<label key={field.name} className={field.type === "textarea" ? "field field-span-2" : "field"}>
									<span>{field.label}</span>
									{field.type === "textarea" ? (
										<textarea value={formValue[field.name]} onChange={(event) => updateField(field.name, event.target.value)} rows={4} />
									) : field.type === "select" ? (
										<select value={formValue[field.name]} onChange={(event) => updateField(field.name, event.target.value)}>
											{field.options.map((option) => (
												<option key={option} value={option}>
													{option}
												</option>
											))}
										</select>
									) : field.type === "file" ? (
										<>
											<input type="file" accept="image/*" onChange={(event) => updateFileField(field.name, event.target.files?.[0] ?? null)} />
											{formValue[field.name] ? <img className="photo-preview" src={formValue[field.name]} alt="Member upload preview" /> : null}
										</>
									) : (
										<input
											type={field.type === "currency" ? "number" : field.type || "text"}
											value={formValue[field.name]}
											onChange={(event) => updateField(field.name, event.target.value)}
											placeholder={field.placeholder}
											min={field.type === "currency" ? 0 : undefined}
										/>
									)}
								</label>
							))}
						</div>

						{error ? <p className="form-error">{error}</p> : null}

						<div className="form-actions">
							<button type="submit" className="primary-button" disabled={saving}>
								{saving ? "Saving..." : editingId ? "Update record" : "Create record"}
							</button>
							<button type="button" className="ghost-button" onClick={resetForm}>
								Clear
							</button>
						</div>
					</form>
				) : (
					<div className="section-card read-only-card">
						<p>Read-only report area for mobile-ready export contracts.</p>
					</div>
				)}

				<div className="table-card">
					{loading ? (
						<div className="empty-state">Loading {title.toLowerCase()}...</div>
					) : items.length === 0 ? (
						<div className="empty-state">No records yet.</div>
					) : (
						<table>
							<thead>
								<tr>
									{visibleColumns.map((column) => (
										<th key={column.key}>{column.label}</th>
									))}
									{!readOnly ? <th>Actions</th> : null}
								</tr>
							</thead>
							<tbody>
								{items.map((item) => (
									<tr key={item.id} className={editingId === item.id ? "selected-row" : ""}>
										{visibleColumns.map((column) => (
											<td key={column.key}>{renderValue(column, item[column.key])}</td>
										))}
										{!readOnly ? (
											<td>
												<div className="inline-actions">
													<button type="button" className="mini-button" onClick={() => editItem(item)}>
														Edit
													</button>
													<button type="button" className="mini-button danger" onClick={() => handleDelete(item.id)}>
														Delete
													</button>
												</div>
											</td>
										) : null}
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</section>
	);
}
