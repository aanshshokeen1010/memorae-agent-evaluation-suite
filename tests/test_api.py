import unittest
from fastapi.testclient import TestClient

from server import app


class TestAPI(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_betterstack_test_connection_empty(self):
        response = self.client.post("/betterstack/test-connection", json={"token": "", "source_id": ""})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["success"])

    def test_evaluate_missing_token_returns_400(self):
        response = self.client.post("/evaluate", json={"prompt": "Test Prompt", "betterstack_token": ""})
        self.assertEqual(response.status_code, 400)
        self.assertIn("Better Stack API Token is required", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()