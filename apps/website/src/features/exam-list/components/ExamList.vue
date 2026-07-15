<script setup lang="ts">
import {
  IconFileDownload,
  IconLoader3,
  IconHelpOctagon,
  IconSparkles,
  IconAdjustmentsHorizontal,
  IconX,
} from "@tabler/icons-vue";
import type {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/vue-table";
import {
  FlexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import { h, inject, onMounted, onUnmounted, ref } from "vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import ExamListLoading from "./ExamListLoading.vue";
import QuickBugButton from "@/components/QuickBugButton.vue";
import { HttpError } from "../api/HttpError";

const currentUrl = window.location.href;

const isHeaderVisible = inject("headerVisible", ref(true));
let lastScrollTop = 0;
const handleHeaderScroll = () => {
  if (window.innerWidth >= 768) {
    isHeaderVisible.value = true;
    return;
  }
  const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
  if (currentScrollTop > lastScrollTop && currentScrollTop > 80) {
    isHeaderVisible.value = false;
  } else if (currentScrollTop < lastScrollTop) {
    isHeaderVisible.value = true;
  }
  lastScrollTop = Math.max(0, currentScrollTop);
};

onMounted(() => {
  window.addEventListener("scroll", handleHeaderScroll, { passive: true });
});
onUnmounted(() => {
  window.removeEventListener("scroll", handleHeaderScroll);
});

import { toast } from "vue-sonner";
import { getExamList } from "../api/getExamList";
import { updateExamList } from "../api/updateExamList";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { getLinkDowExamList } from "../api/getLinkDowExamList";

interface ExamItem {
  examTitle: string; // Tiêu đề bài thi
  uploadDate: string;
  examDetailsUrl: string; // Ngày tải lên
  isNew: boolean; // Cờ đánh dấu bài thi có mới hay không
  pagination: number; //  phân trang hiện tại
  row: number; // Số thứ tự dòng bài thi trong bảng
  isDown?: boolean;
}

type FetchFileResponse = {
  success: boolean;
  response: {
    data: {
      url: string;
    };
  };
  message: string;
  typeError?: string;
};

type FetchResponse = {
  success: boolean;
  message: string;
  response: {
    data: ExamItem[];
  };
  meta: {
    currentPagination: string;
    nextPagination: string;
    shouldUpdate?: boolean;
  };
};

const examsTotal = ref<ExamItem[]>([]);
const examsFrequency = ref<ExamItem[]>([]);
const exams = ref<ExamItem[]>([]);

const fetchingFlag = ref<{ isAuto: boolean; isFetching: boolean }>({
  isAuto: false,
  isFetching: false,
});

const { isPending, isFetching, isError, error } = useQuery({
  queryKey: ["get-exam-list"],
  queryFn: async () => {
    const data = await getExamList(false);
    if (!data.success) {
      return;
    }
    exams.value = data.response.data;
    examsFrequency.value = data.response.data;
    if (data.meta.shouldUpdate) {
      updateExamList();
    }
    return data;
  },
  refetchOnWindowFocus: false,
  retry: (failureCount, error: any) => {
    if (error?.status === 429) {
      return false;
    }
    return failureCount < 3;
  },
});

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: async ({ total }: { total: boolean }): Promise<FetchResponse> => {
    return getExamList(total);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["get-exam-list-total"] });
  },
});

const fetchMore = async (isChecked: boolean) => {
  if (isChecked) {
    if (examsTotal.value.length > 0) {
      exams.value = [...exams.value, ...examsTotal.value];
    } else {
      fetchingFlag.value.isFetching = true;

      try {
        const res = await mutation.mutateAsync({ total: true });
        if (res?.response?.data) {
          examsTotal.value = res.response.data;
          exams.value = [...exams.value, ...res.response.data];
        }
      } catch (error: any) {
        console.error("Fetch failed:", error);
        toast.error("Lỗi", {
          description: "Đã xảy ra lỗi khi tải thêm dữ liệu",
        });
      } finally {
        fetchingFlag.value.isFetching = false;
      }
    }
  } else {
    exams.value = examsFrequency.value;
  }
};

const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({
  examTitle: true,
  examDetailsUrl: true,
  uploadDate: true,
  isNew: false,
  page: true,
});

const showUploadDateOnMobile = ref(false);
const showPageOnMobile = ref(false);

const toggleUploadDate = (checked: boolean) => {
  showUploadDateOnMobile.value = checked;
  columnVisibility.value = {
    ...columnVisibility.value,
    uploadDate: checked,
  };
};

const togglePage = (checked: boolean) => {
  showPageOnMobile.value = checked;
  columnVisibility.value = {
    ...columnVisibility.value,
    page: checked,
  };
};

const updateColumnVisibility = () => {
  const isMd = window.matchMedia("(max-width: 768px)").matches;
  if (isMd) {
    columnVisibility.value = {
      ...columnVisibility.value,
      uploadDate: showUploadDateOnMobile.value,
      page: showPageOnMobile.value,
    };
  } else {
    columnVisibility.value = {
      ...columnVisibility.value,
      uploadDate: true,
      page: true,
    };
  }
};

onMounted(() => {
  updateColumnVisibility();
  window.addEventListener("resize", updateColumnVisibility);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateColumnVisibility);
});

const columns: ColumnDef<ExamItem>[] = [
  {
    accessorKey: "examTitle",
    header: "Tên Đề Thi / Môn Học",
    cell: ({ row }) => {
      const text = row.getValue("examTitle");
      const isNew = row.getValue("isNew");
      return h("div", { class: "flex gap-2 items-start min-w-0" }, [
        h("span", { class: "font-medium text-foreground break-words min-w-0 flex-1" }, text as string),
        isNew
          ? h(IconSparkles, {
              class: "w-4 h-4 text-yellow-500 animate-pulse stroke-1.5 shrink-0 mt-0.5",
            })
          : null,
      ]);
    },
  },

  {
    id: "page",
    accessorFn: (row) => {
      return `${row.pagination}:${row.row} `;
    },
    header: "Số trang",
    cell: ({ row }) => h("div", { class: "text-foreground text-sm" }, row.getValue("page")),
  },

  {
    accessorKey: "uploadDate",
    header: "Ngày tải lên",
    cell: ({ row }) =>
      h("div", { class: "capitalize text-foreground text-sm" }, row.getValue("uploadDate")),
  },

  {
    accessorKey: "isNew",
  },

  {
    accessorKey: "examDetailsUrl",
    header: "Tải xuống",
    cell: ({ row }) => {
      if (row.original.isDown === undefined) {
        row.original.isDown = false;
      }
      const handleClick = async () => {
        row.original.isDown = true;
        const match = /ID=(\d+)/.exec(row.original.examDetailsUrl);
        const id = match ? match[1] : "000000";
        try {
          const res: FetchFileResponse = await getLinkDowExamList(id);
          const url = res?.response?.data?.url;
          if (url && res?.success) {
            const link = url;
            const a = document.createElement("a");
            a.href = link;
            a.download = "";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            row.original.isDown = false;
          } else {
            row.original.isDown = false;
            if (res.typeError === "NOT_FOUND") {
              toast.error("Lỗi", {
                description: "Không tìm thấy tệp tin tải xuống",
              });
            }
            if (res.typeError === "SERVER_ERROR") {
              toast.error("Lỗi", {
                description: "Lỗi server, vui lòng thử lại sau",
              });
            }
          }
        } catch (error: any) {
          row.original.isDown = false;
          toast.error("Lỗi", {
            description: "Đã xảy ra lỗi khi tải xuống",
          });
        }
      };
      return h(
        "div",
        {
          role: "button",
          "aria-label": `Tải xuống ${row.original.examTitle}`,
          title: "Tải xuống đề thi",
          onClick: () => {
            handleClick();
          },
        },
        row.original.isDown
          ? h(IconLoader3, {
              class:
                "w-7 h-7 mx-auto text-primary/80 animate-spin-fast pointer-events-none",
            })
          : h(IconFileDownload, {
              class:
                "w-7 h-7 stroke-[1.25] cursor-pointer mx-auto text-primary/80 hover:text-primary hover:scale-110 transition-transform ease-in-out",
            }),
      );
    },
  },
];

function valueUpdater<T>(
  updaterOrValue: T | ((prev: T) => T),
  currentValue: T,
): T {
  if (typeof updaterOrValue === "function") {
    return (updaterOrValue as (prev: T) => T)(currentValue);
  }
  return updaterOrValue;
}

const table = useVueTable({
  data: exams,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value = valueUpdater(updaterOrValue, columnFilters.value);
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    columnVisibility.value = valueUpdater(
      updaterOrValue,
      columnVisibility.value,
    );
  },
  state: {
    get columnFilters() {
      return columnFilters.value;
    },
    get columnVisibility() {
      return columnVisibility.value;
    },
  },
});
</script>

<template>
  <div v-if="isFetching">
    <ExamListLoading />
  </div>
  <div
    v-else-if="isError"
    class="flex-1 flex flex-col items-center justify-center gap-4"
  >
    <p class="text-destructive text-3xl">Có lỗi xảy ra</p>
    <p class="text-muted-foreground text-sm">Vui lòng thử lại sau!</p>
    <QuickBugButton
      v-if="(error as any)?.status !== 429"
      :context="{
        message: 'Có lỗi xảy ra khi tải dữ liệu',
        page: currentUrl,
      }"
    />
  </div>
  <div v-else class="flex-1 flex flex-col gap-0 -mt-6 lg:-mt-8">
    <!-- Top Action Bar (Search + Config Switch) - Sticky with Glassmorphism -->
    <div class="sticky top-[56px] z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 px-0 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full border-b border-border/60">
      <!-- Search Input Wrapper -->
      <div class="relative w-full md:max-w-md min-w-0">
        <Input
          id="search"
          type="text"
          placeholder="Tìm kiếm mã thi, môn học..."
          class="pl-9 pr-8 w-full bg-background h-9 text-sm"
          :model-value="table.getColumn('examTitle')?.getFilterValue() as string"
          @update:model-value="
            table.getColumn('examTitle')?.setFilterValue($event)
          "
        />
        <span
          class="absolute start-0 inset-y-0 flex items-center justify-center px-3"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-4 text-muted-foreground"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </span>
        <!-- Clear 'X' Button -->
        <button
          v-if="columnFilters.find(f => f.id === 'examTitle')?.value"
          @click="table.getColumn('examTitle')?.setFilterValue('')"
          class="absolute end-0 inset-y-0 flex items-center justify-center px-2.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Xóa nội dung tìm kiếm"
        >
          <IconX class="w-4 h-4" />
        </button>
      </div>

      <!-- Action Controls Wrapper -->
      <div class="flex items-center justify-between md:justify-end gap-4 text-sm w-full md:w-auto">
        <div class="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger class="flex items-center gap-2">
                <Switch
                  id="term"
                  class="scale-90 sm:scale-100"
                  @update:model-value="fetchMore"
                  :disabled="fetchingFlag.isFetching"
                />
                <Label for="term" class="cursor-pointer font-medium text-foreground text-xs sm:text-sm whitespace-nowrap">
                  Tải tất cả
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bật để tải tất cả các trang đề thi từ hệ thống trường</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div class="flex items-center gap-2 text-muted-foreground shrink-0 h-8">
            <!-- Mobile Badge (Stable layout) -->
            <span 
              class="md:hidden flex items-center gap-1.5 bg-muted px-2.5 py-0.5 rounded-full text-[10px] font-semibold border h-6 shrink-0 transition-all duration-300"
              :class="fetchingFlag.isFetching ? 'border-primary bg-primary/5 text-primary animate-pulse' : 'border-border text-muted-foreground'"
            >
              <span>{{ exams[exams.length - 1]?.pagination || 0 }}tr</span>
            </span>

            <!-- Desktop Badge (Stable layout) -->
            <span 
              class="hidden md:flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-xs font-medium border h-7 shrink-0 transition-all duration-300"
              :class="fetchingFlag.isFetching ? 'border-primary bg-primary/5 text-primary animate-pulse' : 'border-border text-muted-foreground'"
            >
              <span>Đã đồng bộ {{ exams[exams.length - 1]?.pagination || 0 }} trang</span>
            </span>
          </div>
        </div>

        <!-- Settings Popover -->
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="icon" class="h-9 w-9 rounded-md border border-border bg-background hover:bg-muted shrink-0" aria-label="Cấu hình hiển thị">
              <IconAdjustmentsHorizontal class="w-4 h-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-48 p-3" align="end">
            <div class="space-y-3">
              <h4 class="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Cấu hình hiển thị</h4>
              
              <!-- Toggle uploadDate -->
              <div class="flex items-center justify-between gap-2">
                <Label for="toggle-date" class="text-xs font-medium text-foreground cursor-pointer">Ngày tải lên</Label>
                <Switch
                  id="toggle-date"
                  class="scale-75 origin-right"
                  :model-value="columnVisibility.uploadDate !== false"
                  @update:model-value="toggleUploadDate"
                />
              </div>

              <!-- Toggle page -->
              <div class="flex items-center justify-between gap-2">
                <Label for="toggle-page" class="text-xs font-medium text-foreground cursor-pointer">Số trang</Label>
                <Switch
                  id="toggle-page"
                  class="scale-75 origin-right"
                  :model-value="columnVisibility.page !== false"
                  @update:model-value="togglePage"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <!-- Table Container Card -->
    <div class="pt-4 pb-4 md:pb-6 flex flex-col gap-6 w-full flex-1">
      <div class="border-y border-x border-border rounded-lg bg-card overflow-hidden flex flex-col flex-1">
        <div class="overflow-x-auto flex-1">
          <Table :class="[(showUploadDateOnMobile || showPageOnMobile) ? 'min-w-[600px]' : '', 'sm:min-w-0']">
            <TableHeader>
              <TableRow
                v-for="headerGroup in table.getHeaderGroups()"
                :key="headerGroup.id"
              >
                <TableHead
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  :class="[
                    'font-bold text-primary py-2.5 px-2 sm:px-4 text-xs sm:text-sm uppercase tracking-wide',
                    header.column.id === 'examDetailsUrl'
                      ? 'text-center w-24 shrink-0 whitespace-nowrap'
                      :                       header.column.id === 'examTitle'
                        ? 'text-left w-full whitespace-normal'
                        : 'text-left whitespace-nowrap',
                  ]"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody class="text-sm sm:text-base divide-y divide-border">
              <template v-if="table.getRowModel().rows?.length">
                <TableRow 
                  v-for="row in table.getRowModel().rows" 
                  :key="row.id"
                  class="hover:bg-muted/50 transition-colors"
                >
                  <TableCell
                    v-for="cell in row.getVisibleCells()"
                    :key="cell.id"
                    :class="[
                      'py-2 px-2 sm:px-4 min-w-0 font-medium text-foreground',
                      cell.column.id === 'examTitle' ? 'max-w-0 w-full whitespace-normal break-words' : '',
                      cell.column.id === 'examDetailsUrl' ? 'w-24 shrink-0 text-center' : '',
                    ]"
                  >
                    <FlexRender
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                  </TableCell>
                </TableRow>

                <!-- Skeleton Rows inside the TableBody during fetch -->
                <template v-if="fetchingFlag.isFetching">
                  <TableRow v-for="i in 3" :key="'skeleton-' + i" class="hover:bg-transparent">
                    <TableCell
                      v-for="column in table.getVisibleFlatColumns()"
                      :key="column.id"
                      :class="[
                        'py-2.5 px-2 sm:px-4 min-w-0',
                        column.id === 'examTitle' ? 'max-w-0 w-full whitespace-normal break-words' : '',
                        column.id === 'examDetailsUrl' ? 'w-24 shrink-0 text-center' : '',
                      ]"
                    >
                      <Skeleton
                        :class="[
                          'h-4 animate-pulse',
                          column.id === 'examTitle' ? 'w-3/4' : 'w-12',
                          column.id === 'examDetailsUrl' ? 'h-8 w-8 rounded-md mx-auto' : 'rounded'
                        ]"
                      />
                    </TableCell>
                  </TableRow>
                </template>
              </template>
              <template v-else>
                <TableRow>
                  <TableCell :colspan="table.getVisibleFlatColumns().length || columns.length" class="h-32 text-center text-muted-foreground">
                    Không có dữ liệu đề thi
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </div>
</template>
