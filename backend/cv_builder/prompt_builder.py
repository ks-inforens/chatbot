def build_prompt(data, has_work_exp=None):
    prompt = f"I am {data.get('full_name')}, I want you to help me draft a CV"

    if data.get("target_country"):
        prompt += f" in {data['target_country']} format"

    if data.get("job_description"):
        prompt += f" according to this JD: {data['job_description']}"

    if data.get("cv_length"):
        prompt += f". It needs to be {data['cv_length']} pages long"

    if data.get("style"):
        prompt += f" in {data['style']} style"

    prompt += ". Make the CV ATS-friendly and human-written. Provide ONLY the CV in a clean format with clear section headers using bullet points. Format it so i can copy-paste into word and export as a pdf. Make sure you provide only the cv without any explanations or citations.\n"

    prompt += f"\nFull Name: {data.get('full_name')}"
    prompt += f"\nEmail: {data.get('email')}"
    prompt += f"\nPhone: {data.get('phone')}"
    prompt += f"\nLinkedIn: {data.get('linkedin') or 'N/A'}"
    prompt += f"\nLocation: {data.get('location') or 'N/A'}"
    prompt += f"\nSkills: {data.get('skills')}"
    prompt += f"\nCertificates and Awards: {data.get('certificates') or 'N/A'}"
    prompt += f"\nProjects: {data.get('projects') or 'N/A'}"

    #add both sections if available, regardless of has_work_exp (for existing workflow)
    if data.get("work_experience"):
        prompt += f"\nWork Experience: {data['work_experience']}"
    if data.get("education"):
        prompt += f"\nEducation: {data['education']}"

    return prompt
