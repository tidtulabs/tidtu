export interface ExamItem {
  examTitle: string;
  uploadDate: string;
  examDetailsUrl: string;
  isNew: boolean;
  pagination: number;
  row: number;
}

export type FetchFileResponse = {
  success: boolean;
  data: {
    url: string;
  };
};

export type FetchResponse = {
  success: boolean;
  data: ExamItem[];
  meta: {
    currentPagination: string;
    nextPagination: string;
    isUpdated: boolean;
  };
};
