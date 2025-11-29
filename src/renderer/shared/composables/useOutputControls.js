import { ref } from 'vue'
import { chooseOutputFolder, parseOutputFolderInput } from '@/shared/utils/app-helpers'

/**
 * 管理输出相关的响应式引用与操作（文件夹与文件名）。
 * 提供选择输出目录和解析用户输入的包装方法。
 */
export function useOutputControls(initialFolder = '', initialFilename = 'output') {
    const outputFolder = ref(initialFolder)
    const outputFilename = ref(initialFilename)

    function setOutputFolder(v) { outputFolder.value = v }
    function setOutputFilename(v) { outputFilename.value = v }

    const chooseOutputFolderHandler = () => chooseOutputFolder(outputFolder)
    const parseOutputFolderInputHandler = () => parseOutputFolderInput(outputFolder, outputFilename)

    return {
        outputFolder,
        outputFilename,
        setOutputFolder,
        setOutputFilename,
        chooseOutputFolderHandler,
        parseOutputFolderInputHandler
    }
}
