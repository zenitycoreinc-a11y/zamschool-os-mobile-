export function getSchoolCodeError(inputCode, expectedCode) {
  const configuredCode = String(expectedCode || "").trim();
  if (!configuredCode) {
    return null;
  }

  const providedCode = String(inputCode || "").trim();
  if (!providedCode) {
    return "School code is required";
  }

  if (providedCode.toLowerCase() !== configuredCode.toLowerCase()) {
    return "Invalid school code.";
  }

  return null;
}

export function canSelfRegisterRole(role) {
  void role;
  return false;
}

export function resolvePostLoginStep(profile) {
  if (profile?.mustChangePassword === true) {
    return "force-password-change";
  }

  return "continue";
}
