from types import SimpleNamespace

from app.services.bill_to import bill_to_for_invoice_pdf, format_bill_to_snapshot, strip_contact_lines_from_bill_to


def test_format_bill_to_snapshot_omits_contact():
    c = SimpleNamespace(
        name="Acme",
        email="a@b.com",
        phone="+2348000000123",
        company=None,
        address_line1="1 Rd",
        address_line2=None,
        city="Lagos",
        region=None,
        postal_code=None,
        country_code="NG",
    )
    text = format_bill_to_snapshot(c)
    assert text is not None
    assert "a@b.com" not in text
    assert "2348000000123" not in text
    assert "Acme" in text


def test_strip_contact_lines_from_legacy_snapshot():
    raw = "Acme\n1 Road St\na@b.com\n+2348000000123"
    out = strip_contact_lines_from_bill_to(
        raw,
        email="a@b.com",
        phone="+2348000000123",
    )
    assert out == "Acme\n1 Road St"


def test_bill_to_for_invoice_pdf():
    assert (
        bill_to_for_invoice_pdf(
            "Co\nx@y.net",
            client_name="Fallback",
            email="x@y.net",
            phone=None,
        )
        == "Co"
    )
