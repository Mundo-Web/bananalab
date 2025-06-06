import React, { useEffect, useRef } from "react"

const SwitchFormGroup = ({ id, col, eRef, label, required = false, onChange, disabled = false, checked, refreshable = null }) => {
  if (!id) id = `ck-${crypto.randomUUID()}`
  if (!eRef) eRef = useRef()

  useEffect(() => {
    $(eRef.current).next('.switchery').remove();

    new Switchery(eRef.current, {
      size: 'small',
      color: '#64b0f2'
    })
    $(eRef.current).on('change', onChange);
  }, [refreshable])

  return <>
    <div className={`form-group ${col} mb-2`}>
      <label htmlFor={id} className="mb-1 form-label d-block">
        {label} {required && <b className="text-danger">*</b>}
      </label>
      <input ref={eRef} id={id} type="checkbox" data-plugin="switchery" required={required} disabled={disabled} defaultChecked={checked} />
    </div>
  </>
}

export default SwitchFormGroup