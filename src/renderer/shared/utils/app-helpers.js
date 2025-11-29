import { stripQuotesStr, splitPath } from './format'
import { openFile, openDirectory } from '@/shared/ipc'

/**
 * 弹出文件选择对话框并把选择的路径写入输入路径引用，同时根据输入推断输出文件夹和默认输出文件名。
 * @param {{value:string}} inputPathRef
 * @param {{value:string}} outputFolderRef
 * @param {{value:string}} outputFilenameRef
 */
export async function chooseFile(inputPathRef, outputFolderRef, outputFilenameRef) {
    try {
        const p = await openFile()
        if (p) {
            inputPathRef.value = p
            const sp = splitPath(p)
            if (sp.folder && !outputFolderRef.value) outputFolderRef.value = sp.folder
            outputFilenameRef.value = `${sp.name}_out`
        }
    } catch (e) { }
}

/**
 * 弹出选择目录对话框并将结果写入输出目录引用。
 * @param {{value:string}} outputFolderRef
 */
export async function chooseOutputFolder(outputFolderRef) {
    try {
        const p = await openDirectory()
        if (p) outputFolderRef.value = p
    } catch (e) { }
}

/**
 * 解析用户输入的输出路径字符串：如果输入包含扩展名，则把目录和文件名分别拆分并设置到引用中。
 */
export function parseOutputFolderInput(outputFolderRef, outputFilenameRef) {
    let v = stripQuotesStr(outputFolderRef.value || '')
    if (!v) return
    outputFolderRef.value = v
    const sp = splitPath(v)
    if (sp.hasExt) {
        if (sp.folder) outputFolderRef.value = sp.folder
        outputFilenameRef.value = sp.name
    }
}

/**
 * 解析输入文件路径（用户手动输入时），并尽量推断输出目录与输出文件名的默认值。
 */
export function parseInputPathInput(inputPathRef, outputFolderRef, outputFilenameRef) {
    const vRaw = stripQuotesStr(inputPathRef.value)
    if (!vRaw) return
    inputPathRef.value = vRaw
    const sp = splitPath(vRaw)
    if (sp.folder && !outputFolderRef.value) outputFolderRef.value = sp.folder
    outputFilenameRef.value = `${sp.name}_out`
}

/**
 * 打开文件选择对话并把选择结果写入 infoFile 引用（用于查询元信息）。
 */
export async function chooseInfoFile(infoFileRef) {
    try {
        const p = await openFile()
        if (p) infoFileRef.value = p
    } catch (e) { }
}

/**
 * 解析并清理信息查询文件输入。
 */
export function parseInfoFileInput(infoFileRef) {
    const v = stripQuotesStr(infoFileRef.value)
    if (!v) return
    infoFileRef.value = v
}
