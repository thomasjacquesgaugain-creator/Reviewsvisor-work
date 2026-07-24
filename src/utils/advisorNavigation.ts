const ADVISOR_RETURN_PATH_KEY = "advisorReturnPath";
const ADVISOR_RETURN_TAB_KEY = "advisorReturnTab";

export const setAdvisorReturnPath = (path: string, tab?: string) => {
  sessionStorage.setItem(ADVISOR_RETURN_PATH_KEY, path);
  if (tab) {
    sessionStorage.setItem(ADVISOR_RETURN_TAB_KEY, tab);
  } else {
    sessionStorage.removeItem(ADVISOR_RETURN_TAB_KEY);
  }
};

export const getAdvisorReturnPath = () =>
  sessionStorage.getItem(ADVISOR_RETURN_PATH_KEY) || "/dashboard";

export const clearAdvisorReturnPath = () => {
  sessionStorage.removeItem(ADVISOR_RETURN_PATH_KEY);
  sessionStorage.removeItem(ADVISOR_RETURN_TAB_KEY);
};
