<script setup lang="ts">
import { DocumentArrowDownIcon, SparklesIcon } from "@heroicons/vue/24/solid";
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
}
type FetchResponse = {
  success: boolean;
  response: {
    data: Exams[];
    is_new: boolean;
    next_pagination: string;
  };
  message: string;
};

async function fetchPage(
  nextPage: string,
  takeOld: boolean = false,
  exCache: Ref<Exams[]>,
) {
  const data = await $fetch<FetchResponse>(
    `/api/scraping/pdaotao/exams${nextPage ? `?next_pagination=${nextPage}` : ""}`,
  );
  isFetching.value = true;
  // console.log("nextPageData", data);
  if (data.success) {
    exams.value = [...exams.value, ...data.response.data];
    exCache.value = [...exCache.value, ...data.response.data];
  }

  if (data.response.next_pagination !== "") {
    if (
      takeOld ||
      (!takeOld && data.response.is_new) ||
      nextPagination.value.currentPage < 5
    ) {
      // console.log(data);
      nextPagination.value.nextPage = data.response.next_pagination;
      nextPagination.value.currentPage += 1;
      await fetchPage(data.response.next_pagination, takeOld, exCache);
    }
  } else {
    nextPagination.value.nextPage = null;
  }

  isFetching.value = false;
}

onMounted(async () => {
  fetchPage("", false, examsNew);
  isMounted.value = true;
  // console.log("mounted");
  updateColumnVisibility();
  window.addEventListener("resize", updateColumnVisibility);
});

let nextPagination = ref<{
  currentPage: number;
  nextPage: string | null;
}>({
  currentPage: 1,
  nextPage: null,
});
const isMounted = ref(false);
const exams = ref<Exams[]>([]);
const examsNew = ref<Exams[]>([]);
const examsOld = ref<Exams[]>([]);
const isFetching = ref<Boolean>(false);
// console.log("exams", fetchedData);

const fetchMore = async (isChecked: boolean) => {
  // console.log("start", examsNew.value);
  if (isChecked) {
    if (examsOld.value.length > 0) {
      exams.value = [...exams.value, ...examsOld.value];
    } else {
      // console.log("fetching more", nextPagination);
      if (nextPagination.value.nextPage) {
        await fetchPage(nextPagination.value.nextPage, true, examsOld);
        // console.log("end", examsNew.value);
      }
    }
  } else {
    // console.log("examsNew", examsNew.value);
    exams.value = [...examsNew.value];
  }
};

const columnFilters = ref<ColumnFiltersState>([]);
const columnVisibility = ref<VisibilityState>({
  text: true,
  dateUpload: true,
  isNew: false,
  href: true,
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
        console.log("Downloading from:", row.original.href);
        const match = /ID=(\d+)/.exec(row.original.href);
        let id = "";

        if (match) {
          id = match[1]; //
        } else {
          id = "000000"; // ID id default
          console.error("Cannot found href.");
        }

        const response = await $fetch(`/api/scraping/pdaotao/exams/${id}`, {
          method: "POST",
          body: JSON.stringify({ url: row.original.href }),
        });
        const data = response?.data;
        if (data?.url) {
          const link = data.url;

          const a = document.createElement("a");
          a.href = link;
          a.download = "";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
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
    <div class="flex gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger class="flex items-center w-fit gap-3">
            <Switch id="term" @update:checked="fetchMore" />
            <Label for="term">Tất cả</Label>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bật để lấy tất cả trang</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <p>({{ nextPagination.currentPage }} trang đã được tải)</p>
    </div>
    <Table>
      <TableHeader>
        <TableRow
          v-for="headerGroup in table.getHeaderGroups()"
          :key="headerGroup.id"
        >
          <TableHead
            :class="[
              'font-bold text-primary',
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
    <div v-if="isFetching">
      <ExamListViewLoading :isShowHeader="false" />
    </div>
  </div>
</template>
