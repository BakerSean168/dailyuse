/**
 * @deprecated This is a backward compatibility shim.
 */
import { ref, reactive } from 'vue';

export function useTaskCompleteDialog() {
  const dialogData = reactive({
    visible: false,
    instanceId: '',
    templateName: '',
  });

  function openCompleteDialog(id: string, name?: string) {
    dialogData.visible = true;
    dialogData.instanceId = id;
    dialogData.templateName = name || '';
  }

  async function confirmComplete() {
    dialogData.visible = false;
    return true;
  }

  function cancelDialog() {
    dialogData.visible = false;
  }

  return { dialogData, openCompleteDialog, confirmComplete, cancelDialog };
}
