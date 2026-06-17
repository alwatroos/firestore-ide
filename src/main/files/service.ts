import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { dialog } from 'electron'
import type { FileFilter, OpenFileResult, SaveFileResult } from '@shared/types/files'

/**
 * Prompt for a destination and write UTF-8 text to it.
 *
 * @param suggestedName - Default file name shown in the dialog.
 * @param content - Text to write.
 * @param filters - Optional extension filters.
 * @returns The chosen path, or a cancelled result.
 */
export async function saveFile(
  suggestedName: string,
  content: string,
  filters?: FileFilter[]
): Promise<SaveFileResult> {
  const result = await dialog.showSaveDialog({ defaultPath: suggestedName, filters })
  if (result.canceled || !result.filePath) return { cancelled: true }
  await writeFile(result.filePath, content, 'utf8')
  return { cancelled: false, path: result.filePath }
}

/**
 * Prompt the user to pick a single file and read its UTF-8 contents.
 *
 * @param filters - Optional extension filters.
 * @returns The file name and contents, or a cancelled result.
 */
export async function openFile(filters?: FileFilter[]): Promise<OpenFileResult> {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters })
  if (result.canceled || result.filePaths.length === 0) return { cancelled: true }
  const path = result.filePaths[0]
  return { cancelled: false, name: basename(path), content: await readFile(path, 'utf8') }
}
