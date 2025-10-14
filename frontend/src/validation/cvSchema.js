import { z } from "zod";

const nonEmptyString = (message) => z.string().trim().min(1, message);

const dateString = (message = "Please enter a valid date") =>
    z
        .string()
        .trim()
        .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), { message });

const workExperienceItemSchema = z
    .object({
        type: nonEmptyString("Please select a work type"),
        jobTitle: nonEmptyString("Please enter a job title"),
        companyName: nonEmptyString("Please enter a company name"),
        startDate: nonEmptyString("Please select a start date"),
        endDate: z.string().optional().default(""),
        isPresent: z.boolean().optional().default(false),
        responsibilities: nonEmptyString("Please describe your responsibilities"),
        achievements: z.string().optional().default(""),
    })
    .superRefine((val, ctx) => {
        if (!val.isPresent) {
            if (!val.endDate || val.endDate.trim() === "") {
                ctx.addIssue({
                    code: 'custom',
                    path: ["endDate"],
                    message: "Please select an end date or mark as Present",
                });
            } else {
                const start = new Date(val.startDate);
                const end = new Date(val.endDate);
                if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ["endDate"],
                        message: "End date must be after start date",
                    });
                }
            }
        }
    });

const educationItemSchema = z
    .object({
        universityName: nonEmptyString("Please select a university"),
        otherUniversityName: z.string().optional().default(""),
        startDate: nonEmptyString("Please select a start date"),
        endDate: z.string().optional().default(""),
        isPresent: z.boolean().optional().default(false),
        results: nonEmptyString("Please add your results/grade"),
        discipline: nonEmptyString("Please select a discipline"),
        course: z.string().optional().default(""),
        level: nonEmptyString("Please select a level of study"),
        location: z.string().optional().default(""),
        region: nonEmptyString("Please select a region"),
        country: nonEmptyString("Please select a country"),
    })
    .superRefine((val, ctx) => {
        if (val.universityName === "Other" && (!val.otherUniversityName || val.otherUniversityName.trim() === "")) {
            ctx.addIssue({
                code: 'custom',
                path: ["otherUniversityName"],
                message: "Please enter the university name",
            });
        }

        if (!val.isPresent) {
            if (!val.endDate || val.endDate.trim() === "") {
                ctx.addIssue({
                    code: 'custom',
                    path: ["endDate"],
                    message: "Please select an end date or mark as Present",
                });
            } else {
                const start = new Date(val.startDate);
                const end = new Date(val.endDate);
                if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ["endDate"],
                        message: "End date must be after start date",
                    });
                }
            }
        }
    });

const projectItemSchema = z.object({
    type: nonEmptyString("Please select a project type"),
    title: nonEmptyString("Please enter a project title"),
    link: z.string().optional().default(""),
    description: nonEmptyString("Please add a description"),
});

const certificateItemSchema = z.object({
    type: z.string().optional().default(""),
    name: z.string().optional().default(""),
    organization: z.string().optional().default(""),
    dateObtained: z.string().optional().default(""),
});

const linkItemSchema = z.object({
    name: z.string().optional().default(""),
    url: z.string().optional().default(""),
});

const additionalSectionItemSchema = z.object({
    title: nonEmptyString("Please enter a section title"),
    desc: nonEmptyString("Please enter a section description"),
});

export function buildCvSchema({ parsedData, formatOption }) {
    const base = z.object({
        firstName: nonEmptyString("Please enter your first name"),
        lastName: nonEmptyString("Please enter your last name"),
        email: z.string().trim().min(1, "Please enter your email").email("Please enter a valid email address"),
        phone: z
            .string()
            .trim()
            .min(1, "Please enter your phone number")
            .regex(/^[+]?[-()\s\d]{10,}$/u, "Please enter a valid phone number"),
        location: z.string().optional().default(""),
        coverLetter: z.boolean().optional(),

        targetCountry: z.string().optional().default(""),
        targetCompany: z.string().optional().default(""),
        targetRole: z.string().optional().default(""),
        jobDescription: z.string().optional().default(""),

        workExperience: z.array(workExperienceItemSchema).optional().default([]),
        education: z.array(educationItemSchema).optional().default([]),
        technicalSkills: z.array(z.string()).optional().default([]),
        languagesKnown: z.array(z.string()).optional().default([]),
        certificates: z.array(certificateItemSchema).optional().default([]),
        projects: z.array(projectItemSchema).optional().default([]),
        links: z.array(linkItemSchema).optional().default([]),
        additionalSec: z.array(additionalSectionItemSchema).optional().default([]),
    });

    return base.superRefine((val, ctx) => {
        const needsTargetCountry = !parsedData || (!!parsedData && formatOption === "country");
        const needsCompany = !!parsedData && formatOption === "company";
        const needsRole = !!parsedData && formatOption === "role";

        if (needsTargetCountry && (!val.targetCountry || val.targetCountry.trim() === "")) {
            ctx.addIssue({ code: 'custom', path: ["targetCountry"], message: "Please select a target country" });
        }

        if (needsCompany) {
            if (!val.targetCompany || val.targetCompany.trim() === "") {
                ctx.addIssue({ code: 'custom', path: ["targetCompany"], message: "Please enter a target company" });
            }
            if (!val.jobDescription || val.jobDescription.trim() === "") {
                ctx.addIssue({ code: 'custom', path: ["jobDescription"], message: "Please paste the job description" });
            }
        }

        if (needsRole && (!val.targetRole || val.targetRole.trim() === "")) {
            ctx.addIssue({ code: 'custom', path: ["targetRole"], message: "Please enter a desired role" });
        }
    });
}


