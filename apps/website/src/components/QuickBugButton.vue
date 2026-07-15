<script setup lang="ts">
import { IconBug } from "@tabler/icons-vue";
import { Button } from "@/components/ui/button";
import { useQuickBugReport, type BugReportContext } from "@/composables/useQuickBugReport";

const props = defineProps<{
  context: BugReportContext;
  label?: string;
}>();

const { report, isSending } = useQuickBugReport();
</script>

<template>
  <Button
    variant="outline"
    size="sm"
    :disabled="isSending"
    @click="report(props.context)"
    class="gap-1.5 text-xs"
  >
    <IconBug v-if="!isSending" class="w-3.5 h-3.5" />
    <svg
      v-else
      class="animate-spin h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    {{ label || "Báo cáo lỗi" }}
  </Button>
</template>
