export type JobType =
  | "email:verification"
  | "email:password-reset"
  | "email:welcome"
  | "email:account-locked"
  | "email:invitation";

export type JobPayloads = {
  "email:verification": {
    to: string;
    userId: string;
    token: string;
  };
  "email:password-reset": {
    to: string;
    userId: string;
    token: string;
  };
  "email:welcome": {
    to: string;
    userId: string;
  };
  "email:account-locked": {
    to: string;
    userId: string;
  };
  "email:invitation": {
    to: string;
    token: string;
    roleName: string;
    expiresAt: string;
  };
};

export type JobDataByType<T extends JobType> = JobPayloads[T];
export type JobData = JobPayloads[JobType];
