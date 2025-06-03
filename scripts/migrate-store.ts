#!/usr/bin/env node

/**
 * 스토어 마이그레이션 도구
 * 기존 useExtendedUnifiedDataStore를 새로운 useUnifiedStore로 마이그레이션
 */

import * as fs from 'fs';
import * as path from 'path';

// 변경해야 할 패턴들
const migrations = [
    {
        from: /import\s*{\s*([^}]*useExtendedUnifiedDataStore[^}]*)\s*}\s*from\s*['"]([^'"]*useUnifiedDataStore)['"];?/g,
        to: 'import { $1 } from "@/stores";'
    },
    {
        from: /useExtendedUnifiedDataStore/g,
        to: 'useUnifiedStore'
    },
    {
        from: /resetStore/g,
        to: 'resetAllStores'
    },
    {
        from: /from\s*['"]@\/stores\/useUnifiedDataStore['"]/g,
        to: 'from "@/stores"'
    },
    {
        from: /from\s*['"][^'"]*\/stores\/useUnifiedDataStore['"]/g,
        to: 'from "@/stores"'
    }
];

// 함수명 변경 매핑
const functionMappings = {
    'resetStore': 'resetAllStores',
    'getCurrentSpreadsheetId': 'currentSpreadsheetId', // getter -> state
    'getSpreadsheetMetadata': 'spreadsheetMetadata', // getter -> state
    'getChatHistory': 'chatHistory', // getter -> state
    'canUploadFile': 'canUploadFile', // 유지
    'getCurrentChatId': 'getCurrentChatId', // 유지 (복잡한 로직)
    'getCurrentSheetChatId': 'getCurrentSheetChatId', // 유지
    'getCurrentChatSession': 'getCurrentChatSession', // 유지
    'getCurrentSheetData': 'getCurrentSheetData' // 유지
};

function migrateFile(filePath: string): boolean {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        // 패턴 기반 마이그레이션
        migrations.forEach(migration => {
            const newContent = content.replace(migration.from, migration.to);
            if (newContent !== content) {
                content = newContent;
                changed = true;
            }
        });

        // 함수명 마이그레이션
        Object.entries(functionMappings).forEach(([oldName, newName]) => {
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            const newContent = content.replace(regex, newName);
            if (newContent !== content) {
                content = newContent;
                changed = true;
            }
        });

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 마이그레이션 완료: ${filePath}`);
            return true;
        } else {
            console.log(`⏭️  변경 없음: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ 마이그레이션 실패: ${filePath}`, error);
        return false;
    }
}

function findTsxFiles(dir: string): string[] {
    const files: string[] = [];
    
    function traverse(currentDir: string) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                traverse(fullPath);
            } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
                files.push(fullPath);
            }
        }
    }
    
    traverse(dir);
    return files;
}

function main() {
    const srcDir = path.join(process.cwd(), 'src');
    const files = findTsxFiles(srcDir);
    
    console.log(`🔍 ${files.length}개 파일 검색 완료`);
    
    let migratedCount = 0;
    
    files.forEach(file => {
        // useUnifiedDataStore를 사용하는 파일만 처리
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('useExtendedUnifiedDataStore') || content.includes('useUnifiedDataStore')) {
            if (migrateFile(file)) {
                migratedCount++;
            }
        }
    });
    
    console.log(`\n🎉 마이그레이션 완료: ${migratedCount}개 파일 변경됨`);
    
    if (migratedCount > 0) {
        console.log('\n📋 다음 단계:');
        console.log('1. TypeScript 컴파일 오류 확인');
        console.log('2. 변경된 파일들 테스트');
        console.log('3. 기존 useUnifiedDataStore.ts 파일 제거');
    }
}

if (require.main === module) {
    main();
}

export { migrateFile, migrations, functionMappings }; 