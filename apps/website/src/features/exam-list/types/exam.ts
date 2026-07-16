export interface ExamItem {
  examTitle: string
  uploadDate: string
  examDetailsUrl: string
  isNew: boolean
  pagination: number
  row: number
}

export type FetchFileResponse = {
  success: boolean
  response: {
    data: {
      url: string
    }
  }
  message: string
  typeError?: string
}

export type FetchResponse = {
  success: boolean
  message: string
  response: {
    data: ExamItem[]
  }
  meta: {
    currentPagination: string
    nextPagination: string
    shouldUpdate?: boolean
  }
}
