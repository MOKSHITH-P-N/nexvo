const {
    calculateAndStoreProjectCandidateScore
} = require('./src/services/projectRankingService');

async function test() {
    try {
        const result =
            await calculateAndStoreProjectCandidateScore({
                projectId: 5,
                freelancerId: 2
            });

        console.log('\n===== PROJECT RANKING TEST =====');
        console.log(JSON.stringify(result, null, 2));
        console.log('================================\n');

        process.exit(0);
    } catch (error) {
        console.error('\n===== TEST FAILED =====');
        console.error(error);
        process.exit(1);
    }
}

test();