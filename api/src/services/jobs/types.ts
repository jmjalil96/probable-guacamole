export type JobType =
  | "email:verification"
  | "email:password-reset"
  | "email:welcome";

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
};

export type JobDataByType<T extends JobType> = JobPayloads[T];
export type JobData = JobPayloads[JobType];
