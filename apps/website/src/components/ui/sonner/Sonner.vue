<script lang="ts" setup>
import {
  IconCircleCheck,
  IconInfoCircle,
  IconAlertTriangle,
  IconCircleX,
  IconLoader2,
  IconX,
} from "@tabler/icons-vue";

import type { ToasterProps } from "vue-sonner";
import { reactiveOmit } from "@vueuse/core";
import { Toaster as Sonner } from "vue-sonner";
import { cn } from "@/lib/utils";

const props = defineProps<ToasterProps>();
const delegatedProps = reactiveOmit(props, "class", "toastOptions");
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
      '--gray2': 'hsl(var(--popover) / 0.9)',
      '--gray3': 'var(--border)',
      '--gray4': 'var(--border)',
      '--gray5': 'var(--border)',
      '--gray12': 'var(--popover-foreground)',
    }"
    :toast-options="
      props.toastOptions ?? {
        classes: {
          toast: 'rounded-2xl',
        },
      }
    "
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <IconCircleCheck class="size-4" />
    </template>
    <template #info-icon>
      <IconInfoCircle class="size-4" />
    </template>
    <template #warning-icon>
      <IconAlertTriangle class="size-4" />
    </template>
    <template #error-icon>
      <IconCircleX class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <IconLoader2 class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <IconX class="size-4" />
    </template>
  </Sonner>
</template>
