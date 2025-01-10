<template>
  <div class="token-usage-statistics bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">Token Usage Statistics</h2>

    <div class="flex items-center mb-6">
      <label for="date-range" class="block text-sm font-medium text-gray-700 mr-4">Select Date Range:</label>
      <input 
        type="date" 
        v-model="startDate" 
        class="border rounded p-2 mr-4"
        :max="endDate"
      >
      <input 
        type="date" 
        v-model="endDate" 
        class="border rounded p-2"
        :min="startDate"
      >
      <button 
        @click="fetchStatistics" 
        class="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        :disabled="store.isLoading"
      >
        {{ store.isLoading ? 'Loading...' : 'Fetch Statistics' }}
      </button>
    </div>

    <div v-if="store.isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="store.getError" class="text-red-600 p-4">
      {{ store.getError }}
    </div>

    <div v-else-if="store.getStatistics.length === 0" class="text-gray-600 p-4">
      No data available for the selected date range.
    </div>

    <div v-else>
      <table class="min-w-full bg-white">
        <thead>
          <tr>
            <th class="py-2 px-4 border">LLM Model</th>
            <th class="py-2 px-4 border">Prompt Tokens</th>
            <th class="py-2 px-4 border">Assistant Tokens</th>
            <th class="py-2 px-4 border">Prompt Tokens Cost</th>
            <th class="py-2 px-4 border">Assistant Tokens Cost</th>
            <th class="py-2 px-4 border">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in store.getStatistics" :key="stat.llmModel">
            <td class="py-2 px-4 border">{{ stat.llmModel }}</td>
            <td class="py-2 px-4 border">{{ stat.promptTokens.toLocaleString() }}</td>
            <td class="py-2 px-4 border">{{ stat.assistantTokens.toLocaleString() }}</td>
            <td class="py-2 px-4 border">€{{ formatNumber(stat.promptCost) }}</td>
            <td class="py-2 px-4 border">€{{ formatNumber(stat.assistantCost) }}</td>
            <td class="py-2 px-4 border">€{{ formatNumber(stat.totalCost) }}</td>
          </tr>
          <!-- Total Row -->
          <tr class="font-semibold bg-gray-50">
            <td class="py-2 px-4 border">Total</td>
            <td class="py-2 px-4 border">{{ getTotalPromptTokens().toLocaleString() }}</td>
            <td class="py-2 px-4 border">{{ getTotalAssistantTokens().toLocaleString() }}</td>
            <td class="py-2 px-4 border">€{{ formatNumber(getTotalPromptCost()) }}</td>
            <td class="py-2 px-4 border">€{{ formatNumber(getTotalAssistantCost()) }}</td>
            <td class="py-2 px-4 border">€{{ formatNumber(store.getTotalCost) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="mt-6 h-[400px]">
        <BarChart :labels="chartLabels" :data="chartData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTokenUsageStatisticsStore } from '~/stores/tokenUsageStatistics';
import BarChart from '~/components/common/BarChart.vue';

const store = useTokenUsageStatisticsStore();
const startDate = ref('');
const endDate = ref('');

const chartLabels = computed(() => store.getStatistics.map(stat => stat.llmModel));
const chartData = computed(() => store.getStatistics.map(stat => stat.totalCost));

const formatNumber = (value: number): string => {
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 20  // This will show all decimal places up to 20
  });
};

const getTotalPromptTokens = (): number => {
  return store.getStatistics.reduce((sum, stat) => sum + stat.promptTokens, 0);
};

const getTotalAssistantTokens = (): number => {
  return store.getStatistics.reduce((sum, stat) => sum + stat.assistantTokens, 0);
};

const getTotalPromptCost = (): number => {
  return store.getStatistics.reduce((sum, stat) => sum + stat.promptCost, 0);
};

const getTotalAssistantCost = (): number => {
  return store.getStatistics.reduce((sum, stat) => sum + stat.assistantCost, 0);
};

const fetchStatistics = async () => {
  if (!startDate.value || !endDate.value) {
    alert('Please select both start and end dates');
    return;
  }
  try {
    await store.fetchStatistics(startDate.value, endDate.value);
  } catch (error) {
    console.error('Error fetching statistics:', error);
  }
};

onMounted(() => {
  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  startDate.value = lastWeek.toISOString().split('T')[0];
  endDate.value = today.toISOString().split('T')[0];
  fetchStatistics();
});
</script>
