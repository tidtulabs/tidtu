<script setup lang="ts">
import type { PaginationFirstProps } from "reka-ui";

import type { HTMLAttributes } from "vue";
import type { ButtonVariants } from "@/components/ui/button";
import { IconChevronsLeft } from "@tabler/icons-vue";
import { reactiveOmit } from "@vueuse/core";
import { PaginationFirst, useForwardProps } from "reka-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const props = withDefaults(
  defineProps<
    PaginationFirstProps & {
      size?: ButtonVariants["size"];
      class?: HTMLAttributes["class"];
    }
  >(),
  {
    size: "default",
  },
);

const delegatedProps = reactiveOmit(props, "class", "size");
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <PaginationFirst
    data-slot="pagination-first"
    :class="cn(buttonVariants({ variant: 'ghost', size }), '', props.class)"
    v-bind="forwarded"
  >
    <slot>
      <IconChevronsLeft />
      <span class="hidden sm:block">Đầu</span>
    </slot>
  </PaginationFirst>
</template>
