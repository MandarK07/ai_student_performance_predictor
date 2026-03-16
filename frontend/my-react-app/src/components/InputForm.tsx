import { useForm } from "react-hook-form";
import Button from "./ui/Button";

export type PredictorFormData = {
  student_code: string;
  gender: string;
  age: number;
  parent_education: string;
  attendance_rate: number;
  study_hours: number;
  previous_gpa: number;
  final_grade: number;
  assignment_score_avg: number;
  exam_score_avg: number;
  class_participation: number;
  late_submissions: number;
  previous_gpa_sem1: number;
  previous_gpa_sem2: number;
};

type Props = {
  onSubmit: (data: PredictorFormData) => void;
};

export default function InputForm({ onSubmit }: Props) {
  const { register, handleSubmit } = useForm<PredictorFormData>();

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
      <input className={inputClass} {...register("student_code", { required: true })} placeholder="Student Code (e.g., S2024001)" />

      <select className={inputClass} {...register("gender", { required: true })}>
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>

      <input className={inputClass} type="number" {...register("age", { required: true, min: 10, max: 100, valueAsNumber: true })} placeholder="Age" />

      <select className={inputClass} {...register("parent_education", { required: true })}>
        <option value="">Parent Education</option>
        <option value="High School">High School</option>
        <option value="Some College">Some College</option>
        <option value="Associate Degree">Associate Degree</option>
        <option value="Bachelor Degree">Bachelor Degree</option>
        <option value="Master Degree">Master Degree</option>
        <option value="Doctorate">Doctorate</option>
      </select>

      <input
        className={inputClass}
        type="number"
        step="0.01"
        {...register("attendance_rate", { required: true, min: 0, max: 100, valueAsNumber: true })}
        placeholder="Attendance Rate (%)"
      />

      <input className={inputClass} type="number" step="0.1" {...register("study_hours", { required: true, min: 0, valueAsNumber: true })} placeholder="Study Hours/Week" />

      <input className={inputClass} type="number" step="0.01" {...register("previous_gpa", { required: true, min: 0, max: 4, valueAsNumber: true })} placeholder="Previous GPA (0-4)" />

      <input className={inputClass} type="number" step="1" {...register("final_grade", { required: true, min: 0, max: 100, valueAsNumber: true })} placeholder="Final Grade" />

      <input
        className={inputClass}
        type="number"
        step="0.01"
        {...register("assignment_score_avg", { required: true, min: 0, max: 100, valueAsNumber: true })}
        placeholder="Assignment Score Avg"
      />

      <input className={inputClass} type="number" step="0.01" {...register("exam_score_avg", { required: true, min: 0, max: 100, valueAsNumber: true })} placeholder="Exam Score Avg" />

      <input
        className={inputClass}
        type="number"
        step="0.01"
        {...register("class_participation", { required: true, min: 0, max: 10, valueAsNumber: true })}
        placeholder="Class Participation (0-10)"
      />

      <input className={inputClass} type="number" {...register("late_submissions", { required: true, min: 0, valueAsNumber: true })} placeholder="Late Submissions" />

      <input className={inputClass} type="number" step="0.01" {...register("previous_gpa_sem1", { required: true, min: 0, max: 4, valueAsNumber: true })} placeholder="GPA Sem 1 (0-4)" />

      <input className={inputClass} type="number" step="0.01" {...register("previous_gpa_sem2", { required: true, min: 0, max: 4, valueAsNumber: true })} placeholder="GPA Sem 2 (0-4)" />

      <div className="md:col-span-2">
        <Button type="submit">Generate Prediction</Button>
      </div>
    </form>
  );
}
