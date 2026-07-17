import React, { useRef, useState } from "react";

const EMPTY_PROJECT = { discharge_distance_ft: "", elevation_gain_ft: "", water_depth_ft: "", solids_size_in: "", specific_gravity: "", percent_solids: "", excavator_model: "", pipe_diameter_in: "", notes: "" };
const numberOrNull = (value) => value === "" ? null : Number(value);

export function ContactForm({ answers, submitting, error, onSubmit }) {
  const [customer, setCustomer] = useState({ name: "", email: "", company: "", phone: "" });
  const [project, setProject] = useState(EMPTY_PROJECT);
  const [website, setWebsite] = useState("");
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const emailRef = useRef(null);
  const updateCustomer = (key) => (event) => setCustomer((value) => ({ ...value, [key]: event.target.value }));
  const updateProject = (key) => (event) => setProject((value) => ({ ...value, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    const trimmedName = customer.name.trim();
    const trimmedEmail = customer.email.trim();
    const validName = trimmedName.length >= 2;
    const emailDomain = trimmedEmail.split("@")[1] || "";
    const validEmailDomain = emailDomain.includes(".") && !emailDomain.startsWith(".") && !emailDomain.endsWith(".");
    setNameError(!validName);
    setEmailError(!validEmailDomain);
    if (!validName || !event.currentTarget.reportValidity() || !validEmailDomain) return;
    onSubmit({
      customer: { ...customer, name: trimmedName, email: trimmedEmail },
      answers: {
        application: answers.application, material: answers.material,
        materialOther: answers.material === "other" ? answers.materialOther : null,
        production: answers.production, head: answers.head || null,
        power: answers.power, deployment: answers.deployment,
      },
      project_details: {
        discharge_distance_ft: numberOrNull(project.discharge_distance_ft), elevation_gain_ft: numberOrNull(project.elevation_gain_ft),
        water_depth_ft: numberOrNull(project.water_depth_ft), solids_size_in: numberOrNull(project.solids_size_in),
        specific_gravity: numberOrNull(project.specific_gravity), percent_solids: numberOrNull(project.percent_solids),
        excavator_model: project.excavator_model.trim() || null, pipe_diameter_in: numberOrNull(project.pipe_diameter_in), notes: project.notes.trim() || null,
      },
      website,
    });
  };
  return <form onSubmit={submit} noValidate={false}>
    <h2>Get fast project pricing &amp; a spec sheet</h2>
    <p>Send this configuration for an engineering-reviewed response.</p>
    <div className="fields">
      <div className="fieldGroup"><label htmlFor="contact-name">Full name <span>(required)</span></label>
        <input id="contact-name" autoComplete="name" required minLength="2" maxLength="120" aria-invalid={nameError} aria-describedby={nameError ? "name-error" : undefined} value={customer.name} onChange={updateCustomer("name")} />
        {nameError && <span id="name-error" role="alert" className="fieldError">Enter at least 2 characters for your name.</span>}
      </div>
      <div className="fieldGroup"><label htmlFor="contact-email">Work email <span>(required)</span></label>
        <input ref={emailRef} id="contact-email" autoComplete="email" type="email" required maxLength="254" aria-invalid={emailError} aria-describedby={emailError ? "email-error" : undefined} value={customer.email} onChange={(event) => { setEmailError(false); updateCustomer("email")(event); }} />
        {emailError && <span id="email-error" role="alert" className="fieldError">Enter a complete email address, including the domain (for example, name@company.com).</span>}
      </div>
      <div className="fieldGroup"><label htmlFor="contact-company">Company <span>(optional)</span></label><input id="contact-company" autoComplete="organization" maxLength="160" value={customer.company} onChange={updateCustomer("company")} /></div>
      <div className="fieldGroup"><label htmlFor="contact-phone">Phone <span>(optional)</span></label><input id="contact-phone" autoComplete="tel" type="tel" maxLength="40" value={customer.phone} onChange={updateCustomer("phone")} /></div>
      <div className="fieldGroup mainNotes"><label htmlFor="project-notes">Project notes <span>(optional)</span></label><textarea id="project-notes" maxLength="4000" value={project.notes} onChange={updateProject("notes")} /></div>
      <details className="projectDetails"><summary>Add optional project details</summary><div className="projectGrid">
        <NumberField id="project-distance" label="Discharge distance (ft)" min="0" max="50000" value={project.discharge_distance_ft} onChange={updateProject("discharge_distance_ft")} />
        <NumberField id="project-elevation" label="Elevation gain (ft)" min="-1000" max="5000" value={project.elevation_gain_ft} onChange={updateProject("elevation_gain_ft")} />
        <NumberField id="project-depth" label="Water depth (ft)" min="0" max="1000" value={project.water_depth_ft} onChange={updateProject("water_depth_ft")} />
        <NumberField id="project-solids" label="Maximum solids size (in)" min="0" max="48" value={project.solids_size_in} onChange={updateProject("solids_size_in")} />
        <NumberField id="project-gravity" label="Specific gravity" min="0.1" max="10" step="0.01" value={project.specific_gravity} onChange={updateProject("specific_gravity")} />
        <NumberField id="project-percent" label="Percent solids" min="0" max="100" step="0.1" value={project.percent_solids} onChange={updateProject("percent_solids")} />
        <NumberField id="project-pipe" label="Pipe diameter (in)" min="0.25" max="48" value={project.pipe_diameter_in} onChange={updateProject("pipe_diameter_in")} />
        {answers.deployment === "excavator" && <div className="fieldGroup"><label htmlFor="project-excavator">Excavator model</label><input id="project-excavator" maxLength="120" value={project.excavator_model} onChange={updateProject("excavator_model")} /></div>}
      </div></details>
      <label className="honeypot" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" maxLength="500" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
    </div>
    <p className="submissionNotice">By submitting, you ask EDDY Pump to contact you about this project. This does not subscribe you to marketing emails. See our <a href="privacy.html">privacy notice</a>.</p>
    <p className="directContact">Trouble submitting? Call <a href="tel:+16196552552">+1 619-655-2552</a> or email <a href="mailto:info@eddypump.com">info@eddypump.com</a>.</p>
    {error && <div className="submitError" role="alert">{error}</div>}
    <button className="cta" type="submit" disabled={submitting}>{submitting ? "Sending securely…" : "Submit my pricing request"}</button>
  </form>;
}

function NumberField({ id, label, ...props }) {
  return <div className="fieldGroup"><label htmlFor={id}>{label}</label><input id={id} type="number" inputMode="decimal" {...props} /></div>;
}
