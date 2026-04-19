import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { predictorSchema, type PredictorSchema } from "../lib/validations/predictor";
import { FormFieldWrapper } from "./ui/FormFieldWrapper";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import Button from "./ui/Button";
import {
  User,
  Users,
  GraduationCap,
  CalendarDays,
  BookOpen,
  Clock,
  Percent,
  CheckCircle,
  FileEdit,
  AlertCircle,
  TrendingUp,
  Activity,
  Award
} from "lucide-react";

export type PredictorFormData = PredictorSchema;

type Props = {
  onSubmit: (data: PredictorFormData) => void;
};

export default function InputForm({ onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<PredictorFormData>({
    resolver: zodResolver(predictorSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* SECTION 1: Personal Information */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
            <User className="w-5 h-5 text-brand-600" />
            Personal Information
          </h3>
          <p className="text-sm text-slate-500">Basic details about the student.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldWrapper label="Student Code" icon={User} error={errors.student_code?.message}>
            <Input {...register("student_code")} placeholder="e.g., 202500001" />
          </FormFieldWrapper>

          <FormFieldWrapper label="Gender" icon={Users} error={errors.gender?.message}>
            <Select {...register("gender")}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </FormFieldWrapper>

          <FormFieldWrapper label="Age" icon={CalendarDays} error={errors.age?.message}>
            <Input type="number" {...register("age", { valueAsNumber: true })} placeholder="Age" />
          </FormFieldWrapper>

          <FormFieldWrapper label="Parent Education" icon={GraduationCap} error={errors.parent_education?.message}>
            <Select {...register("parent_education")}>
              <option value="">Select Level</option>
              <option value="High School">High School</option>
              <option value="Some College">Some College</option>
              <option value="Associate Degree">Associate Degree</option>
              <option value="Bachelor Degree">Bachelor Degree</option>
              <option value="Master Degree">Master Degree</option>
              <option value="Doctorate">Doctorate</option>
            </Select>
          </FormFieldWrapper>
        </div>
      </div>

      {/* SECTION 2: Historical Performance */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
            <Activity className="w-5 h-5 text-brand-600" />
            Historical Performance
          </h3>
          <p className="text-sm text-slate-500">Past academic record (0-10 scale).</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FormFieldWrapper label="Previous GPA" icon={TrendingUp} error={errors.previous_gpa?.message}>
            <Input type="number" step="0.01" {...register("previous_gpa", { valueAsNumber: true })} placeholder="0.0 - 10.0" />
          </FormFieldWrapper>

          <FormFieldWrapper label="GPA Sem 1" icon={BookOpen} error={errors.previous_gpa_sem1?.message}>
            <Input type="number" step="0.01" {...register("previous_gpa_sem1", { valueAsNumber: true })} placeholder="0.0 - 10.0" />
          </FormFieldWrapper>

          <FormFieldWrapper label="GPA Sem 2" icon={BookOpen} error={errors.previous_gpa_sem2?.message}>
            <Input type="number" step="0.01" {...register("previous_gpa_sem2", { valueAsNumber: true })} placeholder="0.0 - 10.0" />
          </FormFieldWrapper>
        </div>
      </div>

      {/* SECTION 3: Current Engagement & Grades */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
            <CheckCircle className="w-5 h-5 text-brand-600" />
            Engagement & Current Metrics
          </h3>
          <p className="text-sm text-slate-500">Attendance, behavior, and ongoing assessments.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormFieldWrapper label="Attendance Rate (%)" icon={Percent} error={errors.attendance_rate?.message}>
            <Input type="number" step="0.01" {...register("attendance_rate", { valueAsNumber: true })} placeholder="0 - 100" />
          </FormFieldWrapper>

          <FormFieldWrapper label="Study Hours/Week" icon={Clock} error={errors.study_hours?.message}>
            <Input type="number" step="0.1" {...register("study_hours", { valueAsNumber: true })} placeholder="Hours" />
          </FormFieldWrapper>

          <FormFieldWrapper label="Class Participation" icon={Users} error={errors.class_participation?.message}>
            <Input type="number" step="0.01" {...register("class_participation", { valueAsNumber: true })} placeholder="0 - 10 scale" />
          </FormFieldWrapper>

          <FormFieldWrapper label="Assignment Avg (%)" icon={FileEdit} error={errors.assignment_score_avg?.message}>
            <Input type="number" step="0.01" {...register("assignment_score_avg", { valueAsNumber: true })} placeholder="0 - 100" />
          </FormFieldWrapper>

          <FormFieldWrapper label="Exam Avg (%)" icon={CheckCircle} error={errors.exam_score_avg?.message}>
            <Input type="number" step="0.01" {...register("exam_score_avg", { valueAsNumber: true })} placeholder="0 - 100" />
          </FormFieldWrapper>

          <FormFieldWrapper label="Late Submissions" icon={AlertCircle} error={errors.late_submissions?.message}>
            <Input type="number" {...register("late_submissions", { valueAsNumber: true })} placeholder="Count" />
          </FormFieldWrapper>

          <div className="md:col-span-2 lg:col-span-3 pt-2">
            <FormFieldWrapper label="Final Grade (%)" icon={Award} error={errors.final_grade?.message} className="max-w-xs">
              <Input type="number" step="1" {...register("final_grade", { valueAsNumber: true })} placeholder="0 - 100" />
            </FormFieldWrapper>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto min-w-[200px]"
        >
          {isSubmitting ? "Processing..." : "Generate Prediction"}
        </Button>
      </div>
    </form>
  );
}
