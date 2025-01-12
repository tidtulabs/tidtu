<script setup lang="ts">
import {
  DocumentArrowDownIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/vue/24/outline";
import { useToast } from "@/components/ui/toast/use-toast";
const { toast } = useToast();
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

export interface Exams {
  text: string;
  dateUpload: string;
  href: string;
  isNew: boolean;
  pagination?: string;
  row?: number;
}
type FetchResponse = {
  success: boolean;
  response: {
    data: Exams[];
    is_new: boolean;
    is_cached: boolean;
    next_pagination: string;
    current_pagination: string;
  };
  message: string;
};

const isMounted = ref(false);
const examsTotal = ref<Exams[]>([]);
const examsFrequency = ref<Exams[]>([]);
const exams = ref<Exams[]>([]);

const fetchingFlag = ref<{ isAuto: boolean; isFetching: boolean }>({
  isAuto: false,
  isFetching: false,
});

const isDownloading = ref<Boolean>(false);

const fetchPage = async (total: boolean) => {
  try {
    const data = await $fetch<FetchResponse>(
      `/api/scraping/pdaotao/exams${total ? `?total=${total}` : ""}`,
    );

    return data;
  } catch (error: any) {
    toast({
      title: "Lỗi (Quá nhiều yêu cầu đến máy chủ hoặc server DTU sập)",
      description: "Vui lòng thử lại sau",
      variant: "error",
    });
  } finally {
    fetchingFlag.value.isAuto = false;
    fetchingFlag.value.isFetching = false;
  }
};
onMounted(async () => {
  isMounted.value = true;
  // console.log("mounted");
  //updateColumnVisibility();
  //window.addEventListener("resize", updateColumnVisibility);
  const res = await fetchPage(false);
  if (res?.response.data) {
    exams.value = res.response.data;
    examsFrequency.value = res.response.data;
  }
  // console.log("exams", exams.value);
});

const fetchMore = async (isChecked: boolean) => {
  if (isChecked) {
    if (examsTotal.value.length > 0) {
      exams.value = [...exams.value, ...examsTotal.value];
    } else {
      fetchingFlag.value.isFetching = true;
      const res = await fetchPage(true);
      if (res?.response.data) {
        examsTotal.value = res.response.data;
        exams.value = [...exams.value, ...res.response.data];
      }
    }
  } else {
    exams.value = examsFrequency.value;
  }
};

const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({
  text: true,
  dateUpload: true,
  isNew: false,
  href: true,
  page: true,
});

const updateColumnVisibility = () => {
  const isMd = window.matchMedia("(max-width: 768px)").matches;
  if (isMd) {
    columnVisibility.value = {
      ...columnVisibility.value,
      dateUpload: false,
    };
  } else {
    columnVisibility.value = {
      ...columnVisibility.value,
      dateUpload: true,
    };
  }
};

const columns: ColumnDef<Exams>[] = [
  {
    accessorKey: "dateUpload",
    header: "Ngày tải lên",
    cell: ({ row }) =>
      h("div", { class: "capitalize" }, row.getValue("dateUpload")),
  },

  {
    accessorKey: "isNew",
  },
  {
    id: "page",
    accessorFn: (row) => {
      const pagination = row.pagination;
      const rowNumber = row.row;
      const regex = /(\d+)/;
      let number = 1;
      if (pagination) {
        const match = regex.exec(pagination);
        if (match) {
          number = parseInt(match[1]);
        }
      }
      return `${number}:${rowNumber} `;
    },
    header: "Số trang",
  },
  {
    accessorKey: "text",
    header: "Mã Thi",
    cell: ({ row }) => {
      const text = row.getValue("text");
      const isNew = row.getValue("isNew");
      return h("div", { class: "flex gap-2 items-center " }, [
        text as string,
        h("span", { class: "text-xs text-gray-500" }, [
          isNew
            ? h(SparklesIcon, {
                class: "w-4 h-4 text-yellow-500 animate-pulse",
              })
            : null,
        ]),
      ]);
    },
  },

  {
    accessorKey: "href",
    header: "Tải xuống",
    cell: ({ row }) => {
      const handleClick = async () => {
        const msg = toast({
          title: "Đang gửi yêu cầu",
          description: "Vui lòng chờ trong giây lát",
        });

        // console.log("Downloading from:", row.original.href);
        const match = /ID=(\d+)/.exec(row.original.href);
        let id = "";

        if (match) {
          id = match[1];
        } else {
          id = "000000";
          console.error("Cannot found href.");
        }

        const res = await $fetch(`/api/scraping/pdaotao/exams/${id}`, {
          method: "POST",
          body: JSON.stringify({ url: row.original.href }),
        });

        const url = res?.response?.url;

        if (url && res?.success) {
          const link = url;
          const a = document.createElement("a");
          a.href = link;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          isDownloading.value = false;
          msg.dismiss();
        } else {
          isDownloading.value = false;
          msg.dismiss();
          toast({
            title: "Lỗi",
            description: res?.message,
            variant: "error",
          });
        }
      };
      return h(
        "div",
        {
          onClick: () => {
            handleClick();
          },
        },

        h(DocumentArrowDownIcon, {
          class:
            "w-6 h-6 cursor-pointer mx-auto text-primary/80 hover:text-primary hover:scale-150 transition-transform ease-in-out",
        }),
      );
    },
  },
];

function valueUpdater<T>(
  updaterOrValue: T | ((prev: T) => T),
  currentValue: T,
): T {
  // If updaterOrValue is a function, call it with the current value
  if (typeof updaterOrValue === "function") {
    return (updaterOrValue as (prev: T) => T)(currentValue);
  }

  // If it's not a function, directly return the new value
  return updaterOrValue;
}

const table = useVueTable({
  data: exams, // Ensure data is always an array
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
  <div v-if="!isMounted || exams.length <= 0">
    <ExamListViewLoading />
  </div>
  <div v-else class="flex-1 flex flex-col gap-5">
    <div class="relative w-full max-w-xl m-auto">
      <Input
        id="search"
        type="text"
        placeholder="Tìm kiếm"
        class="pl-10 w-full"
        :model-value="table.getColumn('text')?.getFilterValue() as string"
        @update:model-value="table.getColumn('text')?.setFilterValue($event)"
      />
      <span
        class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6 text-muted-foreground"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </span>
    </div>

    <div class="flex gap-3 items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger class="flex items-center w-fit gap-3">
            <Switch
              id="term"
              @update:checked="fetchMore"
              :disabled="fetchingFlag.isFetching"
            />
            <Label for="term">Tất cả</Label>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bật để lấy tất cả trang</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <div class="relative">
        <p>
          ({{ exams[exams.length - 1].pagination?.match(/(\d+)/)![1] }} trang đã
          được tải)
        </p>
        <span
          v-if="fetchingFlag.isFetching"
          class="absolute flex h-3 w-3 top-[-10px] right-0"
        >
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            :class="[fetchingFlag.isAuto ? 'bg-primary' : 'bg-blue-500']"
          ></span>
          <span
            class="relative inline-flex rounded-full h-3 w-3"
            :class="[fetchingFlag.isAuto ? 'bg-primary' : 'bg-blue-500']"
          ></span>
        </span>
      </div>
      <Popover>
        <PopoverTrigger>
          <QuestionMarkCircleIcon class="w-5 h-5 text-primary" />
        </PopoverTrigger>
        <PopoverContent>
          <p>Theo mặc định hệ thống tự tải những danh sách mới nhất</p>
          <p>
            <span class="text-primary">Màu đỏ</span> Hệ thống đang tự tải trang
          </p>
          <p>
            <span class="text-blue-500">Màu xanh biển</span> Chức năng lấy tất
            đang được bật
          </p>
        </PopoverContent>
      </Popover>
    </div>

    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead
            :class="[
              'font-bold text-primary ',
              header.column.id === 'href' ? 'text-center' : 'text-left',
            ]"
            v-for="header in headerGroup.headers"
            :key="header.id"
          >
            <FlexRender
              :render="header.column.columnDef.header"
              :props="header.getContext()"
            />
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody class="text-base">
        <template v-if="table.getRowModel().rows?.length">
          <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              Không có dữ liệu
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <div v-if="fetchingFlag.isFetching">
      <ExamListViewLoading :isShowHeader="false" />
    </div>
  </div>
</template>
