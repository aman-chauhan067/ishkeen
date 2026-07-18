export function handleNoneExclusivity(currentValues: string[], newValue: string, isChecked: boolean): string[] {
  // If we are checking the "none" option, clear everything else
  if (newValue === 'none' && isChecked) {
    return ['none'];
  }
  
  // If we are checking a normal option, and "none" was selected, remove "none"
  if (newValue !== 'none' && isChecked) {
    return currentValues.filter(v => v !== 'none').concat(newValue);
  }

  // If we are unchecking, just remove it
  if (!isChecked) {
    return currentValues.filter(v => v !== newValue);
  }

  return currentValues;
}
