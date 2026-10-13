<template>
    <div class="error404">
        <error code="404" :title="$t('error.notFound')"></error>
    </div>
</template>

<script lang="ts" setup>
import Error from './components/error.vue'
</script>
