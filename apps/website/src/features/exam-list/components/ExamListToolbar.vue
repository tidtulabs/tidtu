<script setup lang="ts">
import { IconAdjustmentsHorizontal, IconX } from '@tabler/icons-vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

defineProps<{
  search: string
  isFetchingAll: boolean
  paginationCount: number
  showUploadDate: boolean
  showPage: boolean
}>()

const emit = defineEmits<{
  'update:search': [value: string]
  'toggle:loadAll': [value: boolean]
  'toggle:uploadDate': [value: boolean]
  'toggle:page': [value: boolean]
}>()

function onSearchFocus() {
  window.scrollTo(0, 0)
}
</script>

<template>
  <div class="sticky top-[56px] z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 py-3 px-0 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full border-b border-border/60">
    <div class="relative w-full md:max-w-md min-w-0">
      <Input
        id="search"
        type="text"
        inputmode="search"
        enterkeyhint="search"
        aria-label="Tìm kiếm"
        placeholder="Tìm kiếm mã thi, môn học..."
        class="pl-9 pr-8 w-full bg-background h-9 text-sm"
        :model-value="search"
        @update:model-value="emit('update:search', $event as string)"
        @focus="onSearchFocus"
        @keydown.enter="($event.target as HTMLInputElement)?.blur()"
      />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-muted-foreground">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </span>
      <button
        v-if="search"
        @click="emit('update:search', '')"
        class="absolute end-0 inset-y-0 flex items-center justify-center px-2.5 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Xóa nội dung tìm kiếm"
      >
        <IconX class="w-4 h-4" />
      </button>
    </div>

    <div class="flex items-center justify-between md:justify-end gap-4 text-sm w-full md:w-auto">
      <div class="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger class="flex items-center gap-2">
              <Switch
                id="term"
                class="scale-90 sm:scale-100"
                :disabled="isFetchingAll"
                @update:model-value="emit('toggle:loadAll', $event)"
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
          <span
            class="md:hidden flex items-center gap-1.5 bg-muted px-2.5 py-0.5 rounded-full text-[10px] font-semibold border h-6 shrink-0 transition-all duration-300"
            :class="isFetchingAll ? 'border-primary bg-primary/5 text-primary animate-pulse' : 'border-border text-muted-foreground'"
          >
            <span>{{ paginationCount }}tr</span>
          </span>
          <span
            class="hidden md:flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-xs font-medium border h-7 shrink-0 transition-all duration-300"
            :class="isFetchingAll ? 'border-primary bg-primary/5 text-primary animate-pulse' : 'border-border text-muted-foreground'"
          >
            <span>Đã đồng bộ {{ paginationCount }} trang</span>
          </span>
        </div>
      </div>

      <Popover>
        <PopoverTrigger as-child>
          <Button variant="outline" size="icon" class="h-9 w-9 rounded-md border border-border bg-background hover:bg-muted shrink-0" aria-label="Cấu hình hiển thị">
            <IconAdjustmentsHorizontal class="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-48 p-3" align="end">
          <div class="space-y-3">
            <h4 class="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Cấu hình hiển thị</h4>
            <div class="flex items-center justify-between gap-2">
              <Label for="toggle-date" class="text-xs font-medium text-foreground cursor-pointer">Ngày tải lên</Label>
              <Switch
                id="toggle-date"
                class="scale-75 origin-right"
                :model-value="showUploadDate"
                @update:model-value="emit('toggle:uploadDate', $event)"
              />
            </div>
            <div class="flex items-center justify-between gap-2">
              <Label for="toggle-page" class="text-xs font-medium text-foreground cursor-pointer">Số trang</Label>
              <Switch
                id="toggle-page"
                class="scale-75 origin-right"
                :model-value="showPage"
                @update:model-value="emit('toggle:page', $event)"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>
</template>
