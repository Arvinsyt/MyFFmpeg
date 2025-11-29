import { ref } from 'vue'
import { chooseFile, parseInputPathInput } from '@/shared/utils/app-helpers'

/**
 * 管理输入路径的响应式引用和操作（包括打开文件和解析输入）。
 * @param {{value:string}} outputFolderRef
 * @param {{value:string}} outputFilenameRef
 * @param {string} initial
 */
export function useInputControls(outputFolderRef, outputFilenameRef, initial = '') {
    const inputPath = ref(initial)

    function setInputPath(v) { inputPath.value = v }

    const chooseFileHandler = () => chooseFile(inputPath, outputFolderRef, outputFilenameRef)
    const parseInputPathInputHandler = () => parseInputPathInput(inputPath, outputFolderRef, outputFilenameRef)

    return {
        inputPath,
        setInputPath,
        chooseFileHandler,
        parseInputPathInputHandler
    }
}
