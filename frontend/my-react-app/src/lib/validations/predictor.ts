import { z } from "zod";

export const predictorSchema = z.object({
  student_code: z.string().min(1, "Student Code is required"),
  gender: z.string().min(1, "Gender is required"),
  age: z
    .number({ message: "Age must be a number" })
    .min(10, "Age must be at least 10")
    .max(100, "Age must be at most 100"),
  parent_education: z.string().min(1, "Parent Education is required"),
  
  attendance_rate: z
    .number({ message: "Required" })
    .min(0, "Min 0%")
    .max(100, "Max 100%"),
  study_hours: z
    .number({ message: "Required" })
    .min(0, "Must be positive"),
    
  previous_gpa: z
    .number({ message: "Required" })
    .min(0, "Min 0")
    .max(10, "Max 10"),
  previous_gpa_sem1: z
    .number({ message: "Required" })
    .min(0, "Min 0")
    .max(10, "Max 10"),
  previous_gpa_sem2: z
    .number({ message: "Required" })
    .min(0, "Min 0")
    .max(10, "Max 10"),
    
  final_grade: z
    .number({ message: "Required" })
    .min(0, "Min 0")
    .max(100, "Max 100"),
  assignment_score_avg: z
    .number({ message: "Required" })
    .min(0, "Min 0")
    .max(100, "Max 100"),
  exam_score_avg: z
    .number({ message: "Required" })
    .min(0, "Min 0")
    .max(100, "Max 100"),
    
  class_participation: z
    .number({ message: "Required" })
    .min(0, "Min 0")
    .max(10, "Max 10"),
  late_submissions: z
    .number({ message: "Required" })
    .min(0, "Must be positive"),
});

export type PredictorSchema = z.infer<typeof predictorSchema>;
