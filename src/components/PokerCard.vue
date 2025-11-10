<template>
  <div
    class="poker-card"
    :class="{
      selected: isSelected,
      disabled: disabled
    }"
    @click="handleClick"
  >
    <div class="card-inner">
      <div class="card-front">
        <span class="card-value">{{ label }}</span>
      </div>
      <div class="card-back">
        <span class="card-pattern">🃏</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select']);

const handleClick = () => {
  if (!props.disabled) {
    emit('select', props.value);
  }
};
</script>

<style scoped>
.poker-card {
  aspect-ratio: 2/3;
  perspective: 1000px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.poker-card:hover {
  transform: translateY(-10px);
}

.poker-card.selected {
  transform: scale(1.1);
}

.poker-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.poker-card.disabled:hover {
  transform: none;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.poker-card.selected .card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-front {
  background: white;
  border: 3px solid #4facfe;
}

.card-value {
  font-size: 2.5em;
  font-weight: bold;
  color: #4facfe;
}

.card-back {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  transform: rotateY(180deg);
}

.card-pattern {
  font-size: 3em;
  opacity: 0.5;
}
</style>
