import { messages } from '@/shared/constants/messages'

/**
 * 验证开始转换所需的输入项是否存在。
 * @param {{value:string}} inputPath - 输入文件路径的响应式引用
 * @param {{value:string}} outputFolder - 输出文件夹的响应式引用
 * @param {{value:string}} outputFilename - 输出文件名的响应式引用（不含后缀）
 * @returns {{ok:boolean, msg?:string}} 返回验证结果，失败时包含提示消息
 */
export function validateRunInputs(inputPath, outputFolder, outputFilename) {
    if (!inputPath || !inputPath.value) return { ok: false, msg: messages.selectInput }
    if (!outputFolder || !outputFolder.value) return { ok: false, msg: messages.selectOutputFolder }
    if (!outputFilename || !outputFilename.value) return { ok: false, msg: messages.enterOutputFilename }
    return { ok: true }
}
