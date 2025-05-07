import { useState } from "react";

const DynamicField = ({ label, structure, onChange, typeOptions = [] }) => {
    const [fields, setFields] = useState([]);

    const handleAdd = () => {
        if (typeof structure === "object") {
            setFields([...fields, { ...structure }]);
        } else {
            setFields([...fields, ""]);
        }
    };

    const handleRemove = (index) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
        onChange(newFields);
    };

    const handleFieldChange = (index, key, value) => {
        const newFields = [...fields];
        if (typeof newFields[index] === "object") {
            newFields[index][key] = value;
        } else {
            newFields[index] = value;
        }
        setFields(newFields);
        onChange(newFields);
    };

    return (
        <div className="dynamic-field-container">
            <label className="form-label">{label}</label>

            <div className="fields-list">
                {fields.map((field, index) => (
                    <div key={index} className="field-row">
                        {typeof field === "object" ? (
                            Object.keys(structure).map((key) => (
                                <div key={key} className="field-input">
                                    {key === "type" ? (
                                        <select
                                            className="form-select select-type"
                                            value={field[key]}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    index,
                                                    key,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Seleccionar...
                                            </option>
                                            {typeOptions.map((option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            className="form-control "
                                            value={field[key]}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    index,
                                                    key,
                                                    e.target.value
                                                )
                                            }
                                            placeholder={
                                                key.charAt(0).toUpperCase() +
                                                key.slice(1)
                                            }
                                        />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="field-input">
                                <input
                                    type="text"
                                    className="form-control "
                                    value={field}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            index,
                                            null,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Nueva característica"
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger remove-btn"
                            onClick={() => handleRemove(index)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className="btn btn-sm btn-outline-primary add-btn"
                onClick={handleAdd}
            >
                <i className="fas fa-plus me-1"></i> Agregar
            </button>

            <style jsx>{`
                .dynamic-field-container {
                    margin-bottom: 1rem;
                }

                .fields-list {
                    margin-bottom: 0.5rem;
                }

                .field-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    align-items: center;
                }

                .field-input {
                    flex: 1;
                }

                .remove-btn {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                }

                .add-btn {
                    width: 100%;
                }
            `}</style>
        </div>
    );
};
export default DynamicField;
