import { useEffect, useMemo, useState } from "react";
import {
  createIntervention,
  createGuardianContact,
  getAtRiskStudents,
  getGuardianContacts,
  type AtRiskStudent,
  type CreateGuardianContactRequest,
  type CreateInterventionRequest,
  type GuardianContactResponse,
  type InterventionResponse,
} from "../api/predict";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

type GuardianPanelState = {
  studentCode: string | null;
  loading: boolean;
  error: string | null;
  data: GuardianContactResponse | null;
};

type CreatedInterventionsState = Record<string, InterventionResponse>;

type GuardianFormState = {
  name: string;
  relation: CreateGuardianContactRequest["relation"];
  email: string;
  phone: string;
  education_level: string;
  occupation: string;
  is_primary_contact: boolean;
};

const interventionOptions: Array<CreateInterventionRequest["intervention_type"]> = [
  "Tutoring",
  "Counseling",
  "Study Group",
  "Time Management",
  "Mentorship",
  "Resource Allocation",
  "Other",
];

const priorityOptions: Array<CreateInterventionRequest["priority"]> = ["Low", "Medium", "High", "Urgent"];

function getDefaultInterventionType(student: AtRiskStudent): CreateInterventionRequest["intervention_type"] {
  const recommendation = (student.recommendation || "").toLowerCase();
  if (recommendation.includes("attendance") || recommendation.includes("time")) {
    return "Time Management";
  }
  if (recommendation.includes("counsel")) {
    return "Counseling";
  }
  if (recommendation.includes("mentor")) {
    return "Mentorship";
  }
  return "Tutoring";
}

function buildDefaultIntervention(student: AtRiskStudent): CreateInterventionRequest {
  return {
    intervention_type: getDefaultInterventionType(student),
    priority: student.risk_level === "Critical" ? "Urgent" : "High",
    description:
      student.recommendation ||
      `Follow up with ${student.full_name} on ${student.risk_level.toLowerCase()} risk indicators and document the support plan.`,
    assigned_to: "",
    due_date: "",
  };
}

function buildDefaultGuardianForm(): GuardianFormState {
  return {
    name: "",
    relation: "Guardian",
    email: "",
    phone: "",
    education_level: "",
    occupation: "",
    is_primary_contact: true,
  };
}

export default function AtRiskStudents() {
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [interventionStudentCode, setInterventionStudentCode] = useState<string | null>(null);
  const [interventionForm, setInterventionForm] = useState<CreateInterventionRequest | null>(null);
  const [submittingIntervention, setSubmittingIntervention] = useState(false);
  const [guardianPanel, setGuardianPanel] = useState<GuardianPanelState>({
    studentCode: null,
    loading: false,
    error: null,
    data: null,
  });
  const [guardianFormStudentCode, setGuardianFormStudentCode] = useState<string | null>(null);
  const [guardianForm, setGuardianForm] = useState<GuardianFormState | null>(null);
  const [submittingGuardian, setSubmittingGuardian] = useState(false);
  const [createdInterventions, setCreatedInterventions] = useState<CreatedInterventionsState>({});

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAtRiskStudents();
        if (!active) {
          return;
        }

        const unique = new Map<string, AtRiskStudent>();
        for (const item of response.students) {
          if (!unique.has(item.student_code)) {
            unique.set(item.student_code, item);
          }
        }
        setStudents(Array.from(unique.values()));
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load at-risk students");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => (a.risk_level === "Critical" ? -1 : 1) - (b.risk_level === "Critical" ? -1 : 1)),
    [students]
  );

  const openInterventionForm = (student: AtRiskStudent) => {
    setInterventionStudentCode(student.student_code);
    setInterventionForm(buildDefaultIntervention(student));
  };

  const handleInterventionChange = (field: keyof CreateInterventionRequest, value: string) => {
    setInterventionForm((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        [field]: value,
      };
    });
  };

  const handleCreateIntervention = async (student: AtRiskStudent) => {
    if (!interventionForm) {
      return;
    }

    setSubmittingIntervention(true);
    try {
      const payload: CreateInterventionRequest = {
        intervention_type: interventionForm.intervention_type,
        priority: interventionForm.priority,
        description: interventionForm.description.trim(),
        assigned_to: interventionForm.assigned_to?.trim() || undefined,
        due_date: interventionForm.due_date || undefined,
      };

      const created = await createIntervention(student.student_code, payload);
      setCreatedInterventions((current) => ({
        ...current,
        [student.student_code]: created,
      }));
      setToast({
        message: `Intervention created for ${student.full_name}`,
        type: "success",
      });
      setInterventionStudentCode(null);
      setInterventionForm(null);
    } catch (submitError) {
      setToast({
        message: submitError instanceof Error ? submitError.message : "Failed to create intervention",
        type: "error",
      });
    } finally {
      setSubmittingIntervention(false);
    }
  };

  const handleGuardianLookup = async (student: AtRiskStudent) => {
    if (guardianPanel.studentCode === student.student_code) {
      setGuardianPanel({
        studentCode: null,
        loading: false,
        error: null,
        data: null,
      });
      return;
    }

    setGuardianPanel({
      studentCode: student.student_code,
      loading: true,
      error: null,
      data: null,
    });

    try {
      const data = await getGuardianContacts(student.student_code);
      setGuardianPanel({
        studentCode: student.student_code,
        loading: false,
        error: null,
        data,
      });
    } catch (lookupError) {
      setGuardianPanel({
        studentCode: student.student_code,
        loading: false,
        error: lookupError instanceof Error ? lookupError.message : "Failed to load guardian contacts",
        data: null,
      });
    }
  };

  const openGuardianForm = (student: AtRiskStudent) => {
    setGuardianFormStudentCode(student.student_code);
    setGuardianForm(buildDefaultGuardianForm());
  };

  const handleGuardianFormChange = (field: keyof GuardianFormState, value: string | boolean) => {
    setGuardianForm((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        [field]: value,
      };
    });
  };

  const handleCreateGuardian = async (student: AtRiskStudent) => {
    if (!guardianForm) {
      return;
    }

    setSubmittingGuardian(true);
    try {
      const payload: CreateGuardianContactRequest = {
        name: guardianForm.name.trim(),
        relation: guardianForm.relation,
        email: guardianForm.email.trim() || undefined,
        phone: guardianForm.phone.trim() || undefined,
        education_level: guardianForm.education_level.trim() || undefined,
        occupation: guardianForm.occupation.trim() || undefined,
        is_primary_contact: guardianForm.is_primary_contact,
      };

      const created = await createGuardianContact(student.student_code, payload);
      setGuardianPanel({
        studentCode: student.student_code,
        loading: false,
        error: null,
        data: {
          student_code: student.student_code,
          student_name: student.full_name,
          contacts: guardianPanel.data?.student_code === student.student_code
            ? [...guardianPanel.data.contacts.filter((contact) => !created.is_primary_contact || !contact.is_primary_contact), created]
            : [created],
        },
      });
      setGuardianFormStudentCode(null);
      setGuardianForm(null);
      setToast({
        message: `Guardian contact added for ${student.full_name}`,
        type: "success",
      });
    } catch (submitError) {
      setToast({
        message: submitError instanceof Error ? submitError.message : "Failed to create guardian contact",
        type: "error",
      });
    } finally {
      setSubmittingGuardian(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">At-Risk Students</h1>
        <p className="text-sm text-slate-500">Prioritize interventions for students with elevated risk signals.</p>
      </div>

      {loading && (
        <Card>
          <p className="text-sm text-slate-600">Loading at-risk students...</p>
        </Card>
      )}

      {error && (
        <Card className="border-l-4 border-l-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="space-y-4">
        {sortedStudents.map((student) => {
          const createdIntervention = createdInterventions[student.student_code];
          const guardianPanelOpen = guardianPanel.studentCode === student.student_code;
          const interventionOpen = interventionStudentCode === student.student_code && interventionForm;
          const guardianFormOpen = guardianFormStudentCode === student.student_code && guardianForm;

          return (
            <Card key={student.student_code} className="border-l-4 border-l-red-500">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{student.full_name}</p>
                    <p className="text-sm text-slate-500">
                      {student.student_code} - Predicted GPA {student.predicted_gpa?.toFixed(2) || "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{student.recommendation || "No recommendation available."}</p>
                    {createdIntervention && (
                      <p className="mt-2 text-sm text-emerald-700">
                        Latest intervention: {createdIntervention.intervention_type} ({createdIntervention.priority}) created on{" "}
                        {new Date(createdIntervention.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="high">{student.risk_level} Risk</Badge>
                    <Button variant="danger" size="sm" onClick={() => openInterventionForm(student)}>
                      Create Intervention
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => void handleGuardianLookup(student)}>
                      Contact Guardian
                    </Button>
                  </div>
                </div>

                {interventionOpen && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Create Intervention</h2>
                        <p className="text-sm text-slate-500">This will be stored against the student&apos;s latest at-risk prediction.</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setInterventionStudentCode(null);
                          setInterventionForm(null);
                        }}
                      >
                        Close
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-1 text-sm text-slate-700">
                        <span>Intervention Type</span>
                        <select
                          value={interventionForm.intervention_type}
                          onChange={(event) => handleInterventionChange("intervention_type", event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                        >
                          {interventionOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1 text-sm text-slate-700">
                        <span>Priority</span>
                        <select
                          value={interventionForm.priority}
                          onChange={(event) => handleInterventionChange("priority", event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                        >
                          {priorityOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
                        <span>Description</span>
                        <textarea
                          value={interventionForm.description}
                          onChange={(event) => handleInterventionChange("description", event.target.value)}
                          rows={4}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                        />
                      </label>

                      <label className="space-y-1 text-sm text-slate-700">
                        <span>Assigned To</span>
                        <input
                          type="text"
                          value={interventionForm.assigned_to || ""}
                          onChange={(event) => handleInterventionChange("assigned_to", event.target.value)}
                          placeholder="Teacher or counselor name"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                        />
                      </label>

                      <label className="space-y-1 text-sm text-slate-700">
                        <span>Due Date</span>
                        <input
                          type="date"
                          value={interventionForm.due_date || ""}
                          onChange={(event) => handleInterventionChange("due_date", event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={submittingIntervention || interventionForm.description.trim().length < 10}
                        onClick={() => void handleCreateIntervention(student)}
                      >
                        {submittingIntervention ? "Creating..." : "Save Intervention"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setInterventionForm(buildDefaultIntervention(student));
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}

                {guardianPanelOpen && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Guardian Contact</h2>
                        <p className="text-sm text-slate-500">Live contact details from the database for {student.full_name}.</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setGuardianPanel({
                            studentCode: null,
                            loading: false,
                            error: null,
                            data: null,
                          })
                        }
                      >
                        Close
                      </Button>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openGuardianForm(student)}>
                        Add Guardian Contact
                      </Button>
                    </div>

                    {guardianFormOpen && (
                      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">Add Guardian Contact</h3>
                            <p className="text-xs text-slate-500">Save a guardian record directly to the database.</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setGuardianFormStudentCode(null);
                              setGuardianForm(null);
                            }}
                          >
                            Close
                          </Button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="space-y-1 text-sm text-slate-700">
                            <span>Guardian Name</span>
                            <input
                              type="text"
                              value={guardianForm.name}
                              onChange={(event) => handleGuardianFormChange("name", event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                            />
                          </label>

                          <label className="space-y-1 text-sm text-slate-700">
                            <span>Relationship</span>
                            <select
                              value={guardianForm.relation}
                              onChange={(event) => handleGuardianFormChange("relation", event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                            >
                              <option value="Mother">Mother</option>
                              <option value="Father">Father</option>
                              <option value="Guardian">Guardian</option>
                              <option value="Other">Other</option>
                            </select>
                          </label>

                          <label className="space-y-1 text-sm text-slate-700">
                            <span>Email</span>
                            <input
                              type="email"
                              value={guardianForm.email}
                              onChange={(event) => handleGuardianFormChange("email", event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                            />
                          </label>

                          <label className="space-y-1 text-sm text-slate-700">
                            <span>Phone</span>
                            <input
                              type="text"
                              value={guardianForm.phone}
                              onChange={(event) => handleGuardianFormChange("phone", event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                            />
                          </label>

                          <label className="space-y-1 text-sm text-slate-700">
                            <span>Education Level</span>
                            <input
                              type="text"
                              value={guardianForm.education_level}
                              onChange={(event) => handleGuardianFormChange("education_level", event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                            />
                          </label>

                          <label className="space-y-1 text-sm text-slate-700">
                            <span>Occupation</span>
                            <input
                              type="text"
                              value={guardianForm.occupation}
                              onChange={(event) => handleGuardianFormChange("occupation", event.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2"
                            />
                          </label>
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={guardianForm.is_primary_contact}
                            onChange={(event) => handleGuardianFormChange("is_primary_contact", event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span>Set as primary contact</span>
                        </label>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={submittingGuardian || guardianForm.name.trim().length < 2 || (!guardianForm.email.trim() && !guardianForm.phone.trim())}
                            onClick={() => void handleCreateGuardian(student)}
                          >
                            {submittingGuardian ? "Saving..." : "Save Guardian"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setGuardianForm(buildDefaultGuardianForm())}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}

                    {guardianPanel.loading && <p className="text-sm text-slate-600">Loading guardian contacts...</p>}
                    {guardianPanel.error && <p className="text-sm text-red-700">{guardianPanel.error}</p>}

                    {guardianPanel.data && (
                      <div className="space-y-3">
                        {guardianPanel.data.contacts.map((contact) => (
                          <div key={contact.parent_id} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900">{contact.name}</p>
                                <p className="text-sm text-slate-500">
                                  {contact.relation || "Guardian"}
                                  {contact.is_primary_contact ? " - Primary contact" : ""}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {contact.email ? (
                                  <Button asChild size="sm">
                                    <a href={`mailto:${contact.email}`}>Email Guardian</a>
                                  </Button>
                                ) : (
                                  <Button size="sm" disabled>
                                    Email Unavailable
                                  </Button>
                                )}
                                {contact.phone ? (
                                  <Button asChild variant="secondary" size="sm">
                                    <a href={`tel:${contact.phone}`}>Call Guardian</a>
                                  </Button>
                                ) : (
                                  <Button variant="secondary" size="sm" disabled>
                                    Phone Unavailable
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                              <p>Email: {contact.email || "Not available"}</p>
                              <p>Phone: {contact.phone || "Not available"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {!loading && !error && sortedStudents.length === 0 && (
          <Card>
            <p className="text-sm text-slate-600">No at-risk students found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
